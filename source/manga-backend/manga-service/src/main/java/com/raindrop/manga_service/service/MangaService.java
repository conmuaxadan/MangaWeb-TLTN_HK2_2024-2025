package com.raindrop.manga_service.service;

import com.raindrop.manga_service.dto.request.AdvancedSearchRequest;
import com.raindrop.manga_service.dto.request.MangaRequest;
import com.raindrop.manga_service.dto.response.MangaResponse;
import com.raindrop.manga_service.dto.response.MangaStatisticsResponse;
import com.raindrop.manga_service.dto.response.MangaSummaryResponse;
import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Genre;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.enums.ErrorCode;
import com.raindrop.manga_service.exception.AppException;
import com.raindrop.manga_service.mapper.MangaMapper;
import com.raindrop.manga_service.repository.ChapterRepository;
import com.raindrop.manga_service.repository.GenreRepository;
import com.raindrop.manga_service.repository.MangaRepository;
import com.raindrop.manga_service.repository.httpclient.UploadClient;
import jakarta.persistence.criteria.*;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;



import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class MangaService {
    MangaRepository mangaRepository;
    MangaMapper mangaMapper;
    GenreRepository genreRepository;
    ChapterRepository chapterRepository;
    UploadClient uploadClient;

    @Transactional
    public MangaResponse createManga(MangaRequest request) {
        // Kiểm tra xem manga đã tồn tại chưa
        Manga existingManga = mangaRepository.findByTitle(request.getTitle());
        if (existingManga != null) {
            throw new AppException(ErrorCode.MANGA_ALREADY_EXISTS);
        }
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        var header = attributes.getRequest().getHeader("Authorization");

        var manga = mangaMapper.toManga(request);

        // Khởi tạo danh sách genres rỗng
        manga.setGenres(new ArrayList<>());

        // Thiết lập năm phát hành và tình trạng
        manga.setYearOfRelease(request.getYearOfRelease());
        manga.setStatus(request.getStatus());

        manga = mangaRepository.save(manga);

        // Xử lý genres
        if (request.getGenres() != null && !request.getGenres().isEmpty()) {
            List<Genre> genres = new ArrayList<>();
            for (var genreName : request.getGenres()) {
                var genre = genreRepository.findByName(genreName);
                if (genre == null) {
                    throw new AppException(ErrorCode.GENRE_NOT_FOUND);
                }
                genres.add(genre);
            }
            manga.getGenres().addAll(genres);
            manga = mangaRepository.save(manga);
        }

        // Upload ảnh bìa nếu có
        if (request.getCover() != null && !request.getCover().isEmpty()) {
            try {
                log.info("Uploading cover image for manga: {}", request.getTitle());
                var response = uploadClient.uploadMedia(header,request.getCover());
                manga.setCoverUrl(response.getResult().getFileName());
                log.info("Cover image uploaded successfully: {}", response.getResult().getFileName());
            } catch (Exception e) {
                log.error("Error uploading cover image: {}", e.getMessage());
                throw new AppException(ErrorCode.COVER_UPLOAD_FAILED);
            }
        }

        manga = mangaRepository.save(manga);
        return mangaMapper.toMangaResponse(manga);
    }

    public MangaResponse getMangaByName(String title) {
        var manga = mangaRepository.findByTitleAndDeletedFalse(title);
        if (manga == null) {
            throw new AppException(ErrorCode.MANGA_NOT_FOUND);
        }
        return mangaMapper.toMangaResponse(manga);
    }

    public MangaResponse getMangaById(String id) {
        Manga manga = mangaRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));
        MangaResponse response = mangaMapper.toMangaResponse(manga);

        // Lấy danh sách ID của các chapter và sắp xếp theo số chapter
        List<String> chapterIds = chapterRepository.findByMangaId(id)
                .stream()
                .sorted(Comparator.comparing(Chapter::getChapterNumber))
                .map(Chapter::getId)
                .collect(Collectors.toList());
        response.setChapters(chapterIds);

        return response;
    }


    public List<MangaResponse> getAllMangas() {
        log.info("Getting all active mangas");
        List<Manga> mangas = mangaRepository.findByDeletedFalse();
        log.info("Retrieved {} active mangas", mangas.size());
        return mangas.stream().map(mangaMapper::toMangaResponse).toList();
    }

    /**
     * Lấy danh sách tất cả manga đã bị xóa
     * @return Danh sách manga đã bị xóa
     */
    public List<MangaResponse> getAllDeletedMangas() {
        log.info("Getting all deleted mangas");
        List<Manga> mangas = mangaRepository.findByDeletedTrue();
        log.info("Retrieved {} deleted mangas", mangas.size());
        return mangas.stream().map(mangaMapper::toMangaResponse).toList();
    }

    /**
     * Lấy danh sách manga có phân trang
     * @param pageable Thông tin phân trang
     * @return Danh sách manga có phân trang
     */
    public Page<MangaResponse> getAllMangasPaginated(Pageable pageable) {
        log.info("Getting paginated active mangas with page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Manga> mangasPage = mangaRepository.findByDeletedFalse(pageable);
        Page<MangaResponse> mangaResponsePage = mangasPage.map(mangaMapper::toMangaResponse);
        log.info("Retrieved {} active mangas out of {} total", mangaResponsePage.getNumberOfElements(), mangaResponsePage.getTotalElements());
        return mangaResponsePage;
    }

    /**
     * Lấy danh sách manga đã bị xóa có phân trang
     * @param pageable Thông tin phân trang
     * @return Danh sách manga đã bị xóa có phân trang
     */
    public Page<MangaResponse> getAllDeletedMangasPaginated(Pageable pageable) {
        log.info("Getting paginated deleted mangas with page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Manga> mangasPage = mangaRepository.findByDeletedTrue(pageable);
        Page<MangaResponse> mangaResponsePage = mangasPage.map(mangaMapper::toMangaResponse);
        log.info("Retrieved {} deleted mangas out of {} total", mangaResponsePage.getNumberOfElements(), mangaResponsePage.getTotalElements());
        return mangaResponsePage;
    }

    /**
     * Lấy danh sách tóm tắt manga có phân trang
     * @param pageable Thông tin phân trang
     * @return Danh sách tóm tắt manga có phân trang
     */
    public Page<MangaSummaryResponse> getMangaSummariesPaginated(Pageable pageable) {
        log.info("Getting paginated manga summaries with page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Manga> mangasPage = mangaRepository.findAll(pageable);

        // Chuyển đổi Manga sang MangaSummaryResponse và thêm lastChapterNumber
        Page<MangaSummaryResponse> mangaSummaryResponsePage = mangasPage.map(manga -> {
            MangaSummaryResponse response = mangaMapper.toMangaSummaryResponse(manga);

            // Nếu có lastChapterId, tìm chapter tương ứng để lấy chapterNumber
            if (manga.getLastChapterId() != null) {
                chapterRepository.findById(manga.getLastChapterId()).ifPresent(chapter -> {
                    response.setLastChapterNumber(chapter.getChapterNumber());
                });
            }

            return response;
        });

        log.info("Retrieved {} manga summaries out of {} total", mangaSummaryResponsePage.getNumberOfElements(), mangaSummaryResponsePage.getTotalElements());
        return mangaSummaryResponsePage;
    }

    /**
     * Xóa mềm manga
     * @param id ID của manga cần xóa
     * @param userId ID của người dùng thực hiện xóa
     */
    @Transactional
    public void softDeleteManga(String id, String userId) {
        log.info("Soft deleting manga with ID: {}", id);

        // Tìm manga cần xóa
        var manga = mangaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        // Kiểm tra xem manga đã bị xóa chưa
        if (manga.isDeleted()) {
            log.warn("Manga already deleted: {}", id);
            throw new AppException(ErrorCode.MANGA_ALREADY_DELETED);
        }

        try {
            // Đánh dấu manga đã bị xóa
            manga.setDeleted(true);
            manga.setDeletedAt(java.time.LocalDateTime.now());
            manga.setDeletedBy(userId);

            // Lưu manga
            mangaRepository.save(manga);
            log.info("Successfully soft deleted manga: {}", id);
        } catch (Exception e) {
            log.error("Error soft deleting manga: {}", id, e);
            throw new AppException(ErrorCode.MANGA_DELETE_ERROR, "Error soft deleting manga: " + e.getMessage());
        }
    }

    /**
     * Khôi phục manga đã xóa
     * @param id ID của manga cần khôi phục
     * @return Thông tin manga đã khôi phục
     */
    @Transactional
    public MangaResponse restoreManga(String id) {
        log.info("Restoring manga with ID: {}", id);

        // Tìm manga cần khôi phục
        var manga = mangaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        // Kiểm tra xem manga có bị xóa không
        if (!manga.isDeleted()) {
            log.warn("Manga is not deleted: {}", id);
            throw new AppException(ErrorCode.MANGA_NOT_DELETED);
        }

        try {
            // Đánh dấu manga chưa bị xóa
            manga.setDeleted(false);
            manga.setDeletedAt(null);
            manga.setDeletedBy(null);

            // Lưu manga
            manga = mangaRepository.save(manga);
            log.info("Successfully restored manga: {}", id);

            return mangaMapper.toMangaResponse(manga);
        } catch (Exception e) {
            log.error("Error restoring manga: {}", id, e);
            throw new AppException(ErrorCode.MANGA_RESTORE_ERROR, "Error restoring manga: " + e.getMessage());
        }
    }

    /**
     * Xóa cứng manga (chỉ dùng cho mục đích quản trị đặc biệt)
     * @param id ID của manga cần xóa
     */
    @Transactional
    public void hardDeleteManga(String id) {
        log.info("Hard deleting manga with ID: {}", id);

        // Tìm manga cần xóa
        var manga = mangaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        try {
            // Xóa tất cả các chapter liên quan
            Set<Chapter> chapters = chapterRepository.findByManga(manga);
            log.info("Found {} chapters to delete for manga: {}", chapters.size(), id);

            for (Chapter chapter : chapters) {
                log.info("Deleting chapter: {}", chapter.getId());
                chapterRepository.delete(chapter);
            }

            // Xóa mối quan hệ với Genre
            log.info("Clearing genre relationships for manga: {}", id);
            manga.getGenres().clear();
            mangaRepository.save(manga);

            // Xóa manga
            log.info("Deleting manga: {}", id);
            mangaRepository.delete(manga);
            log.info("Successfully hard deleted manga: {}", id);
        } catch (Exception e) {
            log.error("Error hard deleting manga: {}", id, e);
            throw new AppException(ErrorCode.MANGA_DELETE_ERROR, "Error hard deleting manga: " + e.getMessage());
        }
    }

    /**
     * Xóa manga (sử dụng xóa mềm theo mặc định)
     * @param id ID của manga cần xóa
     * @param userId ID của người dùng thực hiện xóa
     */
    @Transactional
    public void deleteManga(String id, String userId) {
        softDeleteManga(id, userId);
    }

    public MangaResponse updateManga(String id, MangaRequest request) {
        var manga = mangaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        // Kiểm tra xem title mới đã tồn tại chưa (nếu title thay đổi)
        if (!manga.getTitle().equals(request.getTitle())) {
            Manga existingManga = mangaRepository.findByTitle(request.getTitle());
            if (existingManga != null) {
                throw new AppException(ErrorCode.MANGA_ALREADY_EXISTS);
            }
        }

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        var header = attributes.getRequest().getHeader("Authorization");

        // Upload ảnh bìa mới nếu có
        if (request.getCover() != null && !request.getCover().isEmpty()) {
            try {
                uploadClient.deleteMedia(header,manga.getCoverUrl());
                log.info("Uploading new cover image for manga: {}", manga.getTitle());
                var response = uploadClient.uploadMedia(header,request.getCover());
                manga.setCoverUrl(response.getResult().getFileName());
                log.info("New cover image uploaded successfully: {}", response.getResult().getFileName());
            } catch (Exception e) {
                log.error("Error uploading new cover image: {}", e.getMessage());
                throw new AppException(ErrorCode.COVER_UPLOAD_FAILED);
            }
        }

        manga.setTitle(request.getTitle());
        manga.setDescription(request.getDescription());
        manga.setAuthor(request.getAuthor());
        manga.setYearOfRelease(request.getYearOfRelease());
        manga.setStatus(request.getStatus());

        // Xử lý genres - xóa tất cả genres hiện tại và thêm lại các genres mới
        manga.getGenres().clear(); // Xóa tất cả genres hiện tại
        if (request.getGenres() != null && !request.getGenres().isEmpty()) {
            List<Genre> newGenres = new ArrayList<>();
            for (var genreName : request.getGenres()) {
                var genre = genreRepository.findByName(genreName);
                if (genre == null) {
                    throw new AppException(ErrorCode.GENRE_NOT_FOUND);
                }
                newGenres.add(genre);
            }
            manga.getGenres().addAll(newGenres); // Thêm các genres mới
        }
        mangaRepository.save(manga);
        return mangaMapper.toMangaResponse(manga);
    }

    /**
     * Tìm kiếm nâng cao manga
     * @param searchRequest Yêu cầu tìm kiếm nâng cao
     * @param pageable Thông tin phân trang
     * @return Danh sách manga phù hợp với điều kiện tìm kiếm
     */
    public Page<MangaResponse> advancedSearch(AdvancedSearchRequest searchRequest, Pageable pageable) {
        log.info("Advanced search with request: {}", searchRequest);

        // Tạo Specification để xây dựng truy vấn động
        Specification<Manga> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Tìm kiếm theo tiêu đề
            if (searchRequest.getTitle() != null && !searchRequest.getTitle().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("title")),
                        "%" + searchRequest.getTitle().toLowerCase() + "%"));
            }

            // Tìm kiếm theo tác giả
            if (searchRequest.getAuthor() != null && !searchRequest.getAuthor().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("author")),
                        "%" + searchRequest.getAuthor().toLowerCase() + "%"));
            }

            // Tìm kiếm theo thể loại
            if (searchRequest.getGenres() != null && !searchRequest.getGenres().isEmpty()) {
                // Sử dụng subquery để đảm bảo manga chứa TẤT CẢ các thể loại được chọn
                List<String> requestedGenres = searchRequest.getGenres();

                // Tạo subquery để đếm số lượng thể loại khớp
                Subquery<Long> subquery = query.subquery(Long.class);
                Root<Manga> subRoot = subquery.correlate(root);
                Join<Manga, Genre> genreJoin = subRoot.join("genres", JoinType.INNER);

                subquery.select(criteriaBuilder.count(genreJoin.get("name")))
                        .where(genreJoin.get("name").in(requestedGenres));

                // Manga phải chứa đúng số lượng thể loại được yêu cầu
                predicates.add(criteriaBuilder.equal(subquery, (long) requestedGenres.size()));
            }

            // Tìm kiếm theo năm phát hành
            if (searchRequest.getYearOfRelease() != null) {
                predicates.add(criteriaBuilder.equal(root.get("yearOfRelease"), searchRequest.getYearOfRelease()));
            }

            // Tìm kiếm theo tình trạng
            if (searchRequest.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), searchRequest.getStatus()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        // Thực hiện tìm kiếm với Specification và Pageable
        Page<Manga> mangaPage = mangaRepository.findAll(spec, pageable);
        log.info("Found {} mangas matching the search criteria", mangaPage.getTotalElements());

        // Chuyển đổi kết quả sang DTO và thêm thông tin chapter
        return mangaPage.map(manga -> {
            MangaResponse response = mangaMapper.toMangaResponse(manga);

            // Lấy danh sách ID của các chapter và sắp xếp theo số chapter
            List<String> chapterIds = chapterRepository.findByMangaId(manga.getId())
                    .stream()
                    .sorted(Comparator.comparing(Chapter::getChapterNumber))
                    .map(Chapter::getId)
                    .collect(Collectors.toList());
            response.setChapters(chapterIds);

            return response;
        });
    }

    /**
     * Tìm kiếm manga theo từ khóa
     * @param keyword Từ khóa tìm kiếm
     * @param pageable Thông tin phân trang
     * @return Danh sách manga phù hợp với từ khóa
     */
    public Page<MangaResponse> searchByKeyword(String keyword, Pageable pageable) {
        log.info("Searching manga with keyword: {}", keyword);

        // Thực hiện tìm kiếm với từ khóa
        Page<Manga> mangaPage = mangaRepository.searchByKeyword(keyword, pageable);
        log.info("Found {} mangas matching the keyword", mangaPage.getTotalElements());

        // Chuyển đổi kết quả sang DTO và thêm thông tin chapter
        return mangaPage.map(manga -> {
            MangaResponse response = mangaMapper.toMangaResponse(manga);

            // Lấy danh sách ID của các chapter và sắp xếp theo số chapter
            List<String> chapterIds = chapterRepository.findByMangaId(manga.getId())
                    .stream()
                    .sorted(Comparator.comparing(Chapter::getChapterNumber))
                    .map(Chapter::getId)
                    .collect(Collectors.toList());
            response.setChapters(chapterIds);

            return response;
        });
    }

    /**
     * Tìm kiếm manga theo thể loại
     * @param genreName Tên thể loại
     * @param pageable Thông tin phân trang
     * @return Danh sách manga thuộc thể loại
     */
    public Page<MangaResponse> findByGenre(String genreName, Pageable pageable) {
        log.info("Finding manga by genre: {}", genreName);

        // Kiểm tra xem thể loại có tồn tại không
        Genre genre = genreRepository.findByName(genreName);
        if (genre == null) {
            log.warn("Genre not found: {}", genreName);
            throw new AppException(ErrorCode.GENRE_NOT_FOUND);
        }

        // Thực hiện tìm kiếm theo thể loại
        Page<Manga> mangaPage = mangaRepository.findByGenre(genreName, pageable);
        log.info("Found {} mangas in genre {}", mangaPage.getTotalElements(), genreName);

        // Chuyển đổi kết quả sang DTO và thêm thông tin chapter
        return mangaPage.map(manga -> {
            MangaResponse response = mangaMapper.toMangaResponse(manga);

            // Lấy danh sách ID của các chapter và sắp xếp theo số chapter
            List<String> chapterIds = chapterRepository.findByMangaId(manga.getId())
                    .stream()
                    .sorted(Comparator.comparing(Chapter::getChapterNumber))
                    .map(Chapter::getId)
                    .collect(Collectors.toList());
            response.setChapters(chapterIds);

            return response;
        });
    }

    /**
     * Lấy số chapter cao nhất của một truyện
     * @param mangaId ID của truyện
     * @return Số chapter cao nhất
     */
    public Double getHighestChapterNumber(String mangaId) {
        log.info("Getting highest chapter number for manga: {}", mangaId);

        // Kiểm tra truyện có tồn tại không
        Manga manga = mangaRepository.findById(mangaId)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        // Lấy danh sách chapter của truyện
        List<Chapter> chapters = chapterRepository.findByMangaId(mangaId);

        if (chapters.isEmpty()) {
            // Nếu truyện chưa có chapter nào, trả về 0
            log.info("Manga {} has no chapters yet", mangaId);
            return 0.0;
        }

        // Tìm số chapter cao nhất
        double highestChapterNumber = chapters.stream()
                .mapToDouble(Chapter::getChapterNumber)
                .max()
                .orElse(0);

        log.info("Highest chapter number for manga {} is {}", mangaId, highestChapterNumber);

        return highestChapterNumber;
    }

    /**
     * Đếm tổng số truyện trong hệ thống
     * @param includeDeleted Có bao gồm truyện đã xóa hay không
     * @return Tổng số truyện
     */
    public Long countMangas(boolean includeDeleted) {
        log.info("Counting mangas with includeDeleted={}", includeDeleted);

        if (includeDeleted) {
            // Đếm tất cả truyện (bao gồm cả đã xóa)
            return mangaRepository.count();
        } else {
            // Đếm chỉ truyện chưa xóa
            return (long) mangaRepository.findByDeletedFalse().size();
        }
    }

    /**
     * Lấy thống kê tổng hợp về truyện
     * @return Thống kê tổng hợp về truyện
     */
    public MangaStatisticsResponse getMangaStatistics() {
        log.info("Getting manga statistics");

        // Đếm tổng số truyện
        long totalMangas = mangaRepository.count();

        // Đếm số truyện chưa bị xóa
        long activeMangas = mangaRepository.findByDeletedFalse().size();

        // Đếm số truyện đã bị xóa
        long deletedMangas = mangaRepository.findByDeletedTrue().size();

        // Đếm số truyện mới thêm trong ngày hôm nay
        LocalDate today = LocalDate.now();
        long newMangasToday = mangaRepository.findByDeletedFalse().stream()
                .filter(manga -> {
                    if (manga.getCreatedAt() == null) return false;
                    // Lấy LocalDate trực tiếp từ LocalDateTime
                    LocalDate createdDate = manga.getCreatedAt().toLocalDate();
                    return createdDate.isEqual(today);
                })
                .count();

        // Đếm số truyện theo thể loại
        Map<String, Long> mangasByGenre = new HashMap<>();
        List<String> genreNames = mangaRepository.findAllGenreNames();
        for (String genreName : genreNames) {
            // Đếm số truyện có thể loại này
            long count = mangaRepository.findByDeletedFalse().stream()
                    .filter(manga -> manga.getGenres().stream()
                            .anyMatch(genre -> genre.getName().equals(genreName)))
                    .count();
            mangasByGenre.put(genreName, count);
        }

        // Đếm số truyện theo trạng thái
        Map<String, Long> mangasByStatus = new HashMap<>();
        mangasByStatus.put("ONGOING", mangaRepository.findByDeletedFalse().stream()
                .filter(manga -> "ONGOING".equals(manga.getStatus()))
                .count());
        mangasByStatus.put("COMPLETED", mangaRepository.findByDeletedFalse().stream()
                .filter(manga -> "COMPLETED".equals(manga.getStatus()))
                .count());
        mangasByStatus.put("PAUSED", mangaRepository.findByDeletedFalse().stream()
                .filter(manga -> "PAUSED".equals(manga.getStatus()))
                .count());

        // Tạo response
        return MangaStatisticsResponse.builder()
                .totalMangas(totalMangas)
                .activeMangas(activeMangas)
                .deletedMangas(deletedMangas)
                .newMangasToday(newMangasToday)
                .mangasByGenre(mangasByGenre)
                .mangasByStatus(mangasByStatus)
                .build();
    }
}
