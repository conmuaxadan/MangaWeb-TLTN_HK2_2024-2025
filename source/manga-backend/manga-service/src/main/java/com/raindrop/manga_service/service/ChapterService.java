package com.raindrop.manga_service.service;

import com.raindrop.manga_service.dto.request.ChapterRequest;
import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.ChapterInfoResponse;
import com.raindrop.manga_service.dto.response.ChapterResponse;
import com.raindrop.manga_service.dto.response.FileDataResponse;
import com.raindrop.manga_service.dto.response.PageResponse;
import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.entity.Page;
import com.raindrop.manga_service.enums.ErrorCode;
import com.raindrop.manga_service.exception.AppException;
import com.raindrop.manga_service.mapper.ChapterMapper;
import com.raindrop.manga_service.repository.ChapterRepository;
import com.raindrop.manga_service.repository.MangaRepository;
import com.raindrop.manga_service.repository.PageRepository;
import com.raindrop.manga_service.repository.httpclient.UploadClient;
import jakarta.transaction.Transactional;
import com.raindrop.manga_service.kafka.NewChapterEventProducer;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.Collection;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class ChapterService {
    ChapterRepository chapterRepository;
    UploadClient uploadClient;
    MangaRepository mangaRepository;
    PageRepository pageRepository;
    NewChapterEventProducer newChapterEventProducer;

    // ==================== COMMON RESPONSE BUILDING METHODS ====================

    /**
     * Build ChapterResponse từ Chapter entity (tái sử dụng logic chung)
     * @param chapter Chapter entity
     * @return ChapterResponse đã được build
     */
    private ChapterResponse buildChapterResponse(Chapter chapter) {
        return ChapterResponse.builder()
                .id(chapter.getId())
                .chapterNumber(chapter.getChapterNumber())
                .title(chapter.getTitle())
                .mangaTitle(chapter.getManga().getTitle())
                .mangaId(chapter.getManga().getId())
                .pages(buildPageResponses(chapter.getPages()))
                .views(chapter.getViews())
                .comments(chapter.getComments())
                .updatedAt(chapter.getUpdatedAt())
                .build();
    }

    /**
     * Build danh sách PageResponse từ danh sách Page entities
     * @param pages Danh sách Page entities
     * @return Danh sách PageResponse đã được sắp xếp
     */
    private List<PageResponse> buildPageResponses(List<Page> pages) {
        if (pages == null || pages.isEmpty()) {
            return Collections.emptyList();
        }

        return pages.stream()
                .sorted(Comparator.comparingInt(Page::getIndex))
                .map(this::buildPageResponse)
                .toList();
    }

    /**
     * Build PageResponse từ Page entity
     * @param page Page entity
     * @return PageResponse
     */
    private PageResponse buildPageResponse(Page page) {
        return PageResponse.builder()
                .index(page.getIndex())
                .pageUrl(page.getPageUrl())
                .build();
    }

    /**
     * Build ChapterResponse cho create/update operations (với pages đã sorted)
     * @param chapter Chapter entity
     * @return ChapterResponse với pages đã được sắp xếp
     */
    private ChapterResponse buildChapterResponseForModification(Chapter chapter) {
        return ChapterResponse.builder()
                .id(chapter.getId())
                .title(chapter.getTitle())
                .chapterNumber(chapter.getChapterNumber())
                .mangaId(chapter.getManga().getId())
                .pages(buildPageResponses(chapter.getPages()))
                .updatedAt(chapter.getUpdatedAt())
                .build();
    }

    /**
     * Build ChapterInfoResponse từ Chapter entity
     * @param chapter Chapter entity
     * @return ChapterInfoResponse
     */
    private ChapterInfoResponse buildChapterInfoResponse(Chapter chapter) {
        return ChapterInfoResponse.builder()
                .id(chapter.getId())
                .chapterNumber(String.valueOf(chapter.getChapterNumber()))
                .title(chapter.getTitle())
                .mangaId(chapter.getManga().getId())
                .mangaTitle(chapter.getManga().getTitle())
                .build();
    }

    // ==================== OPTIMIZED PAGE OPERATIONS ====================

    /**
     * Tìm page theo chapter ID và index (tối ưu)
     * @param chapterId ID của chapter
     * @param pageIndex Index của page
     * @return Page nếu tìm thấy
     */
    private Page findPageByIndex(String chapterId, int pageIndex) {
        return pageRepository.findByChapterIdAndIndex(chapterId, pageIndex)
                .orElseThrow(() -> new AppException(ErrorCode.PAGE_NOT_FOUND));
    }

    /**
     * Validate page index trong chapter
     * @param chapter Chapter entity
     * @param pageIndex Index cần validate
     */
    private void validatePageIndex(Chapter chapter, int pageIndex) {
        List<Page> pages = chapter.getPages();
        if (pages == null || pages.isEmpty()) {
            throw new AppException(ErrorCode.CHAPTER_NO_PAGES);
        }

        if (pageIndex < 0 || pageIndex >= pages.size()) {
            throw new AppException(ErrorCode.PAGE_INDEX_OUT_OF_RANGE);
        }
    }

    /**
     * Batch update page indexes sau khi xóa page
     * @param pages Danh sách pages cần update
     * @param deletedIndex Index của page đã bị xóa
     */
    private void batchUpdatePageIndexesAfterDeletion(List<Page> pages, int deletedIndex) {
        List<Page> pagesToUpdate = pages.stream()
                .filter(page -> page.getIndex() > deletedIndex)
                .toList();

        if (!pagesToUpdate.isEmpty()) {
            // Update indexes in batch
            pagesToUpdate.forEach(page -> page.setIndex(page.getIndex() - 1));
            pageRepository.saveAll(pagesToUpdate);
            log.info("Batch updated {} page indexes after deletion", pagesToUpdate.size());
        }
    }

    /**
     * Upload multiple pages với error handling
     * @param files Danh sách files cần upload
     * @param chapter Chapter để gán pages
     * @param startIndex Index bắt đầu
     * @param authHeader Authorization header
     * @return Danh sách pages đã được tạo
     */
    private List<Page> uploadMultiplePages(List<MultipartFile> files, Chapter chapter, int startIndex, String authHeader) {
        List<Page> uploadedPages = new ArrayList<>();

        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            try {
                ApiResponse<FileDataResponse> apiResponse = uploadClient.uploadMedia(authHeader, file);
                Page page = Page.builder()
                        .index(startIndex + i)
                        .pageUrl(apiResponse.getResult().getFileName())
                        .chapter(chapter)
                        .build();
                page = pageRepository.save(page);
                uploadedPages.add(page);

                log.debug("Uploaded page {} for chapter {}", startIndex + i, chapter.getId());
            } catch (Exception e) {
                log.error("Error uploading file [{}]: {}", i, e.getMessage());
                // Cleanup uploaded pages if error occurs
                cleanupUploadedPages(uploadedPages, authHeader);
                throw new AppException(ErrorCode.PAGE_UPLOAD_FAILED);
            }
        }

        return uploadedPages;
    }

    /**
     * Cleanup uploaded pages khi có lỗi
     * @param uploadedPages Danh sách pages đã upload
     * @param authHeader Authorization header
     */
    private void cleanupUploadedPages(List<Page> uploadedPages, String authHeader) {
        for (Page page : uploadedPages) {
            try {
                if (page.getPageUrl() != null) {
                    uploadClient.deleteMedia(authHeader, page.getPageUrl());
                }
                pageRepository.delete(page);
            } catch (Exception e) {
                log.warn("Failed to cleanup page: {}", e.getMessage());
            }
        }
    }

    @Transactional
    public ChapterResponse createChapter(ChapterRequest request) {
        if (request.getPages() == null || request.getPages().isEmpty()) {
            throw new AppException(ErrorCode.CHAPTER_NO_PAGES);
        }

        Manga manga = mangaRepository.findById(request.getMangaId())
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        // Lấy thông tin người dùng hiện tại
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = authentication.getName();

        // Kiểm tra quyền sở hữu manga nếu là translator
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        boolean hasTranslatorManagement = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("TRANSLATOR_MANAGEMENT"));
        boolean hasMangaManagement = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("MANGA_MANAGEMENT"));

        if (hasTranslatorManagement && !hasMangaManagement) {
            // Kiểm tra xem manga có thuộc về user này không
            if (!manga.getCreatedBy().equals(currentUserId)) {
                throw new AppException(ErrorCode.UNAUTHORIZED_OPERATION);
            }
        }

        // **Tạo Chapter trước để có ID**
        Chapter chapter = Chapter.builder()
                .chapterNumber(request.getChapterNumber())
                .title(request.getTitle())
                .manga(manga)
                .createdBy(currentUserId) // Thêm dòng này
                .build();
        chapter = chapterRepository.save(chapter);

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        var header = attributes.getRequest().getHeader("Authorization");

        // **Tạo và lưu các Page sử dụng helper method**
        List<Page> pages = uploadMultiplePages(request.getPages(), chapter, 0, header);

        // **Cập nhật danh sách pages trong Chapter (đồng bộ hóa)**
        chapter.setPages(pages);
        chapterRepository.save(chapter); // Cập nhật Chapter với danh sách pages

        // Cập nhật ID chapter mới nhất của manga
        manga.setLastChapterId(chapter.getId());
        // Cập nhật thời gian thêm chapter mới nhất của manga
        manga.setLastChapterAddedAt(LocalDateTime.now());
        mangaRepository.save(manga);

        // Cập nhật tổng số lượt xem và comment của manga
//        mangaStatsService.updateMangaTotalViews(manga.getId());
//        mangaStatsService.updateMangaTotalComments(manga.getId());

        // Gửi sự kiện chapter mới để thông báo cho người dùng đã yêu thích truyện
        newChapterEventProducer.sendNewChapterEvent(
                manga.getId(),
                manga.getTitle(),
                chapter.getId(),
                chapter.getChapterNumber(),
                chapter.getTitle()
        );

        // **Tạo response sử dụng helper method**
        return buildChapterResponseForModification(chapter);
    }

    public ChapterResponse getChapterById(String id) {
        // Sử dụng eager loading để tránh N+1 problem
        Chapter chapter = chapterRepository.findByIdWithPagesAndManga(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));
        return buildChapterResponse(chapter);
    }


    public org.springframework.data.domain.Page<ChapterResponse> getAllChapters(Pageable pageable) {
        org.springframework.data.domain.Page<Chapter> chapters = chapterRepository.findAllWithPagesAndManga(pageable);
        return chapters.map(this::buildChapterResponse);
    }

    public org.springframework.data.domain.Page<ChapterResponse> searchAndFilterChapters(String mangaId, Pageable pageable) {
        mangaId = (mangaId != null && !mangaId.trim().isEmpty()) ? mangaId.trim() : null;
        org.springframework.data.domain.Page<Chapter> chapters = chapterRepository.searchAndFilterChaptersWithPages(mangaId, pageable);
        return chapters.map(this::buildChapterResponse);
    }

    public List<ChapterResponse> getChaptersByMangaId(String mangaId) {
        Manga manga = mangaRepository.findById(mangaId)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        List<Chapter> chapters = chapterRepository.findByMangaIdWithPages(mangaId);
        return chapters.stream()
                .map(this::buildChapterResponse)
                .toList();
    }

    public ChapterInfoResponse getChapterInfo(String id) {
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));
        return buildChapterInfoResponse(chapter);
    }

    @Transactional
    public ChapterResponse updateChapter(String id, ChapterRequest request) {
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));

        if (request.getTitle() != null && !request.getTitle().isEmpty()) {
            chapter.setTitle(request.getTitle());
        }

        // Cập nhật danh sách trang nếu có
        if (request.getPages() != null && !request.getPages().isEmpty()) {
            // Lấy danh sách trang hiện tại
            List<Page> currentPages = chapter.getPages();
            if (currentPages == null) {
                // Nếu danh sách là null, khởi tạo một danh sách mới
                currentPages = new ArrayList<>();
                chapter.setPages(currentPages);
            }

            // Tính toán index bắt đầu cho các trang mới
            int startIndex = currentPages.isEmpty() ? 0 :
                    currentPages.stream()
                            .mapToInt(Page::getIndex)
                            .max()
                            .orElse(-1) + 1;

            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            var header = attributes.getRequest().getHeader("Authorization");
            List<Page> newPages = uploadMultiplePages(request.getPages(), chapter, startIndex, header);
            chapter.getPages().addAll(newPages);
        }

        // Lưu chapter đã cập nhật
        chapter = chapterRepository.save(chapter);

        return buildChapterResponseForModification(chapter);
    }

    @Transactional
    public ChapterResponse updateChapterPage(String id, int pageIndex, MultipartFile pageFile) {

        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));

        validatePageIndex(chapter, pageIndex);
        Page pageToUpdate = findPageByIndex(id, pageIndex);

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        var header = attributes.getRequest().getHeader("Authorization");

        try {
            ApiResponse<FileDataResponse> apiResponse = uploadClient.uploadMedia(header, pageFile);
            pageToUpdate.setPageUrl(apiResponse.getResult().getFileName());
            pageRepository.save(pageToUpdate);
            chapter = chapterRepository.save(chapter);
            return buildChapterResponseForModification(chapter);
        } catch (Exception e) {
            throw new AppException(ErrorCode.PAGE_UPLOAD_FAILED);
        }
    }

    @Transactional
    public ChapterResponse deleteChapterPage(String id, int pageIndex) {

        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));

        validatePageIndex(chapter, pageIndex);

        // Find the page to delete from the chapter's managed collection
        Page pageToDelete = null;
        for (Page p : chapter.getPages()) {
            if (p.getIndex() == pageIndex) {
                pageToDelete = p;
                break;
            }
        }

        if (pageToDelete == null) {
            // Should have been caught by validatePageIndex if pageIndex was out of initial bounds,
            // or indicates an inconsistency if pageIndex was valid but page not found by value.
            throw new AppException(ErrorCode.PAGE_NOT_FOUND);
        }

        // Remove the page from the chapter's collection.
        // Hibernate will handle the actual deletion from the DB due to orphanRemoval=true
        // when the chapter is saved.
        chapter.getPages().remove(pageToDelete);

        // The 'pages' list for batchUpdatePageIndexesAfterDeletion
        // is chapter.getPages(), which now has pageToDelete removed.
        // The deletedIndex is the original index of the page that was removed.
        batchUpdatePageIndexesAfterDeletion(chapter.getPages(), pageIndex);

        // Save the chapter. This persists changes to the pages collection (including the removal)
        // and triggers deletion of the orphaned page.
        // It also saves changes to indices of other pages if batchUpdatePageIndexesAfterDeletion modified them.
        Chapter updatedChapter = chapterRepository.save(chapter);

        return buildChapterResponseForModification(updatedChapter);
    }

    @Transactional
    public void deleteChapter(String id) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        var header = attributes.getRequest().getHeader("Authorization");
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));

        Manga manga = chapter.getManga();
        boolean isLatestChapter = id.equals(manga.getLastChapterId());

        List<Page> pages = chapter.getPages();
        if (pages != null && !pages.isEmpty()) {
            for (Page page : pages) {
                try {
                    if (page.getPageUrl() != null && !page.getPageUrl().isEmpty()) {
                        uploadClient.deleteMedia(header, page.getPageUrl());
                    }
                } catch (Exception e) {
                    log.error("Error deleting page file: {}", e.getMessage(), e);
                }
            }
            // pageRepository.deleteByChapterId(id); // Loại bỏ dòng này để tránh xóa kép
        }

        chapterRepository.delete(chapter); // Việc này nên cascade để xóa các Page liên quan

        if (isLatestChapter) {
            updateMangaLatestChapter(manga);
        }
    }

    private void updateMangaLatestChapter(Manga manga) {
        List<Chapter> remainingChapters = chapterRepository.findByMangaIdOrderByChapterNumberDesc(manga.getId());

        if (remainingChapters.isEmpty()) {
            manga.setLastChapterId(null);
            manga.setLastChapterAddedAt(null);
        } else {
            Chapter newLatestChapter = remainingChapters.get(0);
            manga.setLastChapterId(newLatestChapter.getId());
            manga.setLastChapterAddedAt(newLatestChapter.getCreatedAt());
        }

        mangaRepository.save(manga);
    }

    // ==================== TRANSLATOR METHODS ====================

    public org.springframework.data.domain.Page<ChapterResponse> getChaptersByCreatedBy(String createdBy, String keyword, Pageable pageable) {
        org.springframework.data.domain.Page<Chapter> chapters;

        if (keyword != null && !keyword.trim().isEmpty()) {
            chapters = chapterRepository.findByCreatedByAndTitleContainingIgnoreCase(createdBy, keyword, pageable);
        } else {
            chapters = chapterRepository.findByCreatedBy(createdBy, pageable);
        }

        return chapters.map(this::buildChapterResponse);
    }
}

