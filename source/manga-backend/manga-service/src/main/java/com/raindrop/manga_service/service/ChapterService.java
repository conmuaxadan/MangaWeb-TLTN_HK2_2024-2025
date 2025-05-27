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
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class ChapterService {
    ChapterRepository chapterRepository;
    ChapterMapper chapterMapper;
    UploadClient uploadClient;
    MangaRepository mangaRepository;
    PageRepository pageRepository;
    NewChapterEventProducer newChapterEventProducer;

    @Transactional
    public ChapterResponse createChapter(ChapterRequest request) {
        if (request.getPages() == null || request.getPages().isEmpty()) {
            throw new AppException(ErrorCode.CHAPTER_NO_PAGES);
        }

        Manga manga = mangaRepository.findById(request.getMangaId())
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        // **Tạo Chapter trước để có ID**
        Chapter chapter = Chapter.builder()
                .chapterNumber(request.getChapterNumber())
                .title(request.getTitle())
                .manga(manga)
                .build();
        chapter = chapterRepository.save(chapter);

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        var header = attributes.getRequest().getHeader("Authorization");

        // **Tạo và lưu các Page, gán Chapter cho từng Page**
        List<Page> pages = new ArrayList<>();
        for (int i = 0; i < request.getPages().size(); i++) {
            MultipartFile file = request.getPages().get(i);
            try {
                ApiResponse<FileDataResponse> apiResponse = uploadClient.uploadMedia(header, file);
                Page page = Page.builder()
                        .index(i)
                        .pageUrl(apiResponse.getResult().getFileName())
                        .chapter(chapter) // Gán Chapter cho Page
                        .build();
                page = pageRepository.save(page); // Lưu Page
                pages.add(page); // Thêm vào danh sách pages
            } catch (Exception e) {
                log.error("Error uploading file [{}]: {}", i, e.getMessage());
                throw new AppException(ErrorCode.PAGE_UPLOAD_FAILED);
            }
        }

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

        // **Tạo response**
        return ChapterResponse.builder()
                .title(chapter.getTitle())
                .chapterNumber(chapter.getChapterNumber())
                .mangaId(chapter.getManga().getId())
                .pages(chapter.getPages().stream()
                        .sorted(Comparator.comparingInt(Page::getIndex))
                        .map(page -> PageResponse.builder()
                                .index(page.getIndex())
                                .pageUrl(page.getPageUrl())
                                .build())
                        .toList())
                .updatedAt(chapter.getUpdatedAt())
                .build();
    }

    public ChapterResponse getChapterById(String id) {
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));
        return chapterMapper.toChapterResponse(chapter);
    }


    /**
     * Lấy tất cả chapter
     *
     * @return Danh sách tất cả chapter
     */
    public org.springframework.data.domain.Page<ChapterResponse> getAllChapters(Pageable pageable) {
        log.info("Getting all chapters with pagination");
        org.springframework.data.domain.Page<Chapter> pages = chapterRepository.findAll(pageable);

        return pages.map(chapter -> {
            return ChapterResponse.builder()
                    .id(chapter.getId())
                    .chapterNumber(chapter.getChapterNumber())
                    .title(chapter.getTitle())
                    .mangaTitle(chapter.getManga().getTitle())
                    .pages(chapter.getPages().stream()
                            .sorted(Comparator.comparingInt(Page::getIndex))
                            .map(page -> PageResponse.builder()
                                    .index(page.getIndex())
                                    .pageUrl(page.getPageUrl())
                                    .build())
                            .toList())
                    .views(chapter.getViews())
                    .comments(chapter.getComments())
                    .mangaId(chapter.getManga().getId())
                    .updatedAt(chapter.getUpdatedAt())
                    .build();
        });

    }

    /**
     * Tìm kiếm và lọc chapter theo manga
     *
     * @param mangaId ID của manga cần lọc (null nếu không lọc theo manga)
     * @param pageable Thông tin phân trang
     * @return Danh sách chapter đã được lọc
     */
    public org.springframework.data.domain.Page<ChapterResponse> searchAndFilterChapters(String mangaId, Pageable pageable) {
        log.info("Searching and filtering chapters with criteria - mangaId: {}", mangaId);

        // Xử lý trường hợp mangaId rỗng
        mangaId = (mangaId != null && !mangaId.trim().isEmpty()) ? mangaId.trim() : null;

        org.springframework.data.domain.Page<Chapter> chapters = chapterRepository.searchAndFilterChapters(mangaId, pageable);

        org.springframework.data.domain.Page<ChapterResponse> chapterResponsePage = chapters.map(chapter -> {
            return ChapterResponse.builder()
                    .id(chapter.getId())
                    .chapterNumber(chapter.getChapterNumber())
                    .title(chapter.getTitle())
                    .mangaTitle(chapter.getManga().getTitle())
                    .pages(chapter.getPages().stream()
                            .sorted(Comparator.comparingInt(Page::getIndex))
                            .map(page -> PageResponse.builder()
                                    .index(page.getIndex())
                                    .pageUrl(page.getPageUrl())
                                    .build())
                            .toList())
                    .views(chapter.getViews())
                    .comments(chapter.getComments())
                    .mangaId(chapter.getManga().getId())
                    .updatedAt(chapter.getUpdatedAt())
                    .build();
        });

        log.info("Found {} chapters matching the criteria", chapterResponsePage.getTotalElements());
        return chapterResponsePage;
    }

    /**
     * Lấy danh sách chapter của một manga
     *
     * @param mangaId ID của manga
     * @return Danh sách chapter của manga
     */
    public List<ChapterResponse> getChaptersByMangaId(String mangaId) {
        log.info("Getting chapters for manga: {}", mangaId);

        // Kiểm tra manga có tồn tại không
        Manga manga = mangaRepository.findById(mangaId)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        Set<Chapter> chapters = chapterRepository.findByManga(manga);
        List<ChapterResponse> chapterResponses = chapters.stream()
                .sorted(Comparator.comparing(Chapter::getChapterNumber))
                .map(chapterMapper::toChapterResponse)
                .toList();

        log.info("Retrieved {} chapters for manga: {}", chapterResponses.size(), mangaId);
        return chapterResponses;
    }

    /**
     * Lấy thông tin cơ bản của chapter
     * @param id ID của chapter
     * @return Thông tin cơ bản của chapter
     */
    public ChapterInfoResponse getChapterInfo(String id) {
        log.info("Getting basic info for chapter: {}", id);
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));

        return ChapterInfoResponse.builder()
                .id(chapter.getId())
                .chapterNumber(String.valueOf(chapter.getChapterNumber()))
                .title(chapter.getTitle())
                .mangaId(chapter.getManga().getId())
                .mangaTitle(chapter.getManga().getTitle())
                .build();
    }

    /**
     * Cập nhật chapter
     * @param id ID của chapter
     * @param request Thông tin cập nhật
     * @return Thông tin chapter sau khi cập nhật
     */
    @Transactional
    public ChapterResponse updateChapter(String id, ChapterRequest request) {
        log.info("Updating chapter: {}", id);

        // Kiểm tra chapter có tồn tại không
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));

        // Cập nhật tiêu đề nếu có
        if (request.getTitle() != null && !request.getTitle().isEmpty()) {
            chapter.setTitle(request.getTitle());
        } else {
            log.info("No title provided or empty title, keeping existing title: {}", chapter.getTitle());
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

            log.info("Adding {} new pages starting from index {}", request.getPages().size(), startIndex);

            // Tạo các trang mới
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            var header = attributes.getRequest().getHeader("Authorization");

            for (int i = 0; i < request.getPages().size(); i++) {
                MultipartFile file = request.getPages().get(i);
                try {
                    ApiResponse<FileDataResponse> apiResponse = uploadClient.uploadMedia(header, file);
                    Page page = Page.builder()
                            .index(startIndex + i) // Sử dụng index mới
                            .pageUrl(apiResponse.getResult().getFileName())
                            .chapter(chapter)
                            .build();
                    page = pageRepository.save(page);

                    // Thêm trang mới vào danh sách trang của chapter
                    chapter.getPages().add(page);
                } catch (Exception e) {
                    log.error("Error uploading file [{}]: {}", i, e.getMessage());
                    throw new AppException(ErrorCode.PAGE_UPLOAD_FAILED);
                }
            }
        }

        // Lưu chapter đã cập nhật
        chapter = chapterRepository.save(chapter);

        return chapterMapper.toChapterResponse(chapter);
    }

    /**
     * Cập nhật một trang cụ thể trong chapter
     * @param id ID của chapter
     * @param pageIndex Vị trí của trang cần cập nhật
     * @param pageFile File ảnh mới
     * @return Thông tin chapter sau khi cập nhật
     */
    @Transactional
    public ChapterResponse updateChapterPage(String id, int pageIndex, MultipartFile pageFile) {
        log.info("Updating page at index {} for chapter: {}", pageIndex, id);

        // Kiểm tra chapter có tồn tại không
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));

        // Kiểm tra danh sách trang
        List<Page> pages = chapter.getPages();
        if (pages == null || pages.isEmpty()) {
            throw new AppException(ErrorCode.CHAPTER_NO_PAGES);
        }

        // Kiểm tra pageIndex có hợp lệ không
        if (pageIndex < 0 || pageIndex >= pages.size()) {
            throw new AppException(ErrorCode.PAGE_INDEX_OUT_OF_RANGE);
        }

        // Tìm trang cần cập nhật
        Page pageToUpdate = null;
        for (Page page : pages) {
            if (page.getIndex() == pageIndex) {
                pageToUpdate = page;
                break;
            }
        }

        if (pageToUpdate == null) {
            throw new AppException(ErrorCode.PAGE_NOT_FOUND);
        }

        // Tải lên ảnh mới
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        var header = attributes.getRequest().getHeader("Authorization");

        try {
            ApiResponse<FileDataResponse> apiResponse = uploadClient.uploadMedia(header, pageFile);

            // Cập nhật URL của trang
            pageToUpdate.setPageUrl(apiResponse.getResult().getFileName());
            pageRepository.save(pageToUpdate);

            // Lưu chapter đã cập nhật
            chapter = chapterRepository.save(chapter);

            return chapterMapper.toChapterResponse(chapter);
        } catch (Exception e) {
            log.error("Error uploading file for page index {}: {}", pageIndex, e.getMessage());
            throw new AppException(ErrorCode.PAGE_UPLOAD_FAILED);
        }
    }

    /**
     * Xóa một trang cụ thể trong chapter
     * @param id ID của chapter
     * @param pageIndex Vị trí của trang cần xóa
     * @return Thông tin chapter sau khi xóa trang
     */
    @Transactional
    public ChapterResponse deleteChapterPage(String id, int pageIndex) {
        log.info("Deleting page at index {} for chapter: {}", pageIndex, id);

        // Kiểm tra chapter có tồn tại không
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));

        // Kiểm tra danh sách trang
        List<Page> pages = chapter.getPages();
        if (pages == null || pages.isEmpty()) {
            throw new AppException(ErrorCode.CHAPTER_NO_PAGES);
        }

        // Kiểm tra pageIndex có hợp lệ không
        if (pageIndex < 0 || pageIndex >= pages.size()) {
            throw new AppException(ErrorCode.PAGE_INDEX_OUT_OF_RANGE);
        }

        // Tìm trang cần xóa
        Page pageToDelete = null;
        for (Page page : pages) {
            if (page.getIndex() == pageIndex) {
                pageToDelete = page;
                break;
            }
        }

        if (pageToDelete == null) {
            throw new AppException(ErrorCode.PAGE_NOT_FOUND);
        }

        // Xóa trang
        pages.remove(pageToDelete);
        pageRepository.delete(pageToDelete);

        // Cập nhật lại index của các trang còn lại
        for (Page page : pages) {
            if (page.getIndex() > pageIndex) {
                page.setIndex(page.getIndex() - 1);
                pageRepository.save(page);
            }
        }

        // Lưu chapter đã cập nhật
        chapter = chapterRepository.save(chapter);

        return chapterMapper.toChapterResponse(chapter);
    }

    /**
     * Xóa một chapter
     * @param id ID của chapter cần xóa
     */
    @Transactional
    public void deleteChapter(String id) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        var header = attributes.getRequest().getHeader("Authorization");
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));

        // Lấy manga để cập nhật lại thông tin sau khi xóa chapter
        Manga manga = chapter.getManga();

        // Kiểm tra xem chapter đang xóa có phải là chapter mới nhất không
        boolean isLatestChapter = id.equals(manga.getLastChapterId());

        // Xóa tất cả các trang của chapter
        for (Page page : chapter.getPages()) {
            try {
                // Xóa file từ upload service
                if (page.getPageUrl() != null && !page.getPageUrl().isEmpty()) {
                    uploadClient.deleteMedia(header,page.getPageUrl());
                }
            } catch (Exception e) {
                log.error("Error deleting page file: {}", e.getMessage(), e);
                // Tiếp tục xóa chapter ngay cả khi không xóa được file
            }
        }

        // Xóa chapter từ database
        chapterRepository.delete(chapter);
        log.info("Chapter deleted successfully: {}", id);

        // Nếu chapter vừa xóa là chapter mới nhất, cập nhật lại thông tin manga
        if (isLatestChapter) {
            log.info("Deleted chapter was the latest chapter, updating manga info...");
            updateMangaLatestChapter(manga);
        }
    }

    /**
     * Cập nhật thông tin chapter mới nhất của manga sau khi xóa chapter
     * @param manga Manga cần cập nhật
     */
    private void updateMangaLatestChapter(Manga manga) {
        // Lấy danh sách chapter còn lại của manga, sắp xếp theo chapterNumber giảm dần
        List<Chapter> remainingChapters = chapterRepository.findByMangaIdOrderByChapterNumberDesc(manga.getId());

        if (remainingChapters.isEmpty()) {
            // Nếu không còn chapter nào, set lastChapterId và lastChapterAddedAt về null
            manga.setLastChapterId(null);
            manga.setLastChapterAddedAt(null);
            log.info("No chapters remaining for manga: {}, set lastChapterId to null", manga.getId());
        } else {
            // Lấy chapter có chapterNumber cao nhất (chapter đầu tiên trong danh sách đã sắp xếp)
            Chapter newLatestChapter = remainingChapters.get(0);
            manga.setLastChapterId(newLatestChapter.getId());
            manga.setLastChapterAddedAt(newLatestChapter.getCreatedAt());
            log.info("Updated latest chapter for manga: {} to chapter: {} (number: {})",
                    manga.getId(), newLatestChapter.getId(), newLatestChapter.getChapterNumber());
        }

        // Lưu thông tin manga đã cập nhật
        mangaRepository.save(manga);
    }
}
