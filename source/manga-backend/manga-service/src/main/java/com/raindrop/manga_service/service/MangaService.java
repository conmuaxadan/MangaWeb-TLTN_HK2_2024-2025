package com.raindrop.manga_service.service;

import com.raindrop.manga_service.dto.request.AdvancedSearchRequest;
import com.raindrop.manga_service.dto.request.MangaRequest;
import com.raindrop.manga_service.dto.response.*;
import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Genre;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.enums.ErrorCode;
import com.raindrop.manga_service.enums.MangaStatus;
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
import org.springframework.data.domain.PageRequest;
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
    MangaSummariesRedisService mangaSummariesRedisService;

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
                var response = uploadClient.uploadMedia(header, request.getCover());
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

    public Page<MangaManagementResponse> getAllMangas(Pageable pageable) {
        log.info("Getting all mangas with page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Manga> mangasPage = mangaRepository.findByDeletedFalse(pageable);
        return mangasPage.map(manga -> {
            MangaManagementResponse response = mangaMapper.toMangaManagementResponse(manga);
            response.setChapters(chapterRepository.countByMangaId(manga.getId()));
            return response;
        });
    }


    /**
     * Lấy danh sách tất cả manga đã bị xóa
     *
     * @return Danh sách manga đã bị xóa
     */
    public Page<MangaManagementResponse> getAllDeletedMangas(Pageable pageable) {
        log.info("Getting all mangas with page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Manga> mangasPage = mangaRepository.findByDeletedTrue(pageable);
        return mangasPage.map(manga -> {
            MangaManagementResponse response = mangaMapper.toMangaManagementResponse(manga);
            response.setChapters(chapterRepository.countByMangaId(manga.getId()));
            return response;
        });
    }


    /**
     * Lấy danh sách manga đã bị xóa có phân trang
     *
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
     *
     * @param pageable Thông tin phân trang
     * @return Danh sách tóm tắt manga có phân trang
     */
    public Page<MangaSummaryResponse> getMangaSummariesPaginated(Pageable pageable) {
        log.info("Getting paginated manga summaries with page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());

        // Kiểm tra xem có phải là request cho latest updates không (sort by lastChapterAddedAt,desc)
        boolean isLatestUpdatesRequest = pageable.getSort().stream()
                .anyMatch(order -> "lastChapterAddedAt".equals(order.getProperty()) &&
                                 order.getDirection().isDescending());

        // Nếu là latest updates request, thử lấy từ cache trước
        if (isLatestUpdatesRequest) {
            log.debug("This is a latest updates request, checking cache...");
            try {
                Page<MangaSummaryResponse> cachedResult = mangaSummariesRedisService.getFromCache(pageable);
                if (cachedResult != null) {
                    log.info("Cache hit! Returning cached latest updates: page={}, size={}",
                        pageable.getPageNumber(), pageable.getPageSize());
                    return cachedResult;
                }
                log.debug("Cache miss, querying database...");
            } catch (Exception e) {
                log.warn("Error accessing cache, falling back to database: {}", e.getMessage());
            }
        }

        // Query database
        Page<Manga> mangasPage = mangaRepository.findByDeletedFalse(pageable);

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

        // Nếu là latest updates request, cache kết quả
        if (isLatestUpdatesRequest) {
            log.debug("Caching latest updates result...");
            try {
                mangaSummariesRedisService.saveToCache(pageable, mangaSummaryResponsePage);
            } catch (Exception e) {
                log.warn("Error saving to cache: {}", e.getMessage());
            }
        }

        log.info("Retrieved {} manga summaries out of {} total", mangaSummaryResponsePage.getNumberOfElements(), mangaSummaryResponsePage.getTotalElements());
        return mangaSummaryResponsePage;
    }

    /**
     * Xóa mềm manga
     *
     * @param id     ID của manga cần xóa
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
     *
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
     *
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
     *
     * @param id     ID của manga cần xóa
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
                uploadClient.deleteMedia(header, manga.getCoverUrl());
                log.info("Uploading new cover image for manga: {}", manga.getTitle());
                var response = uploadClient.uploadMedia(header, request.getCover());
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
     *
     * @param searchRequest Yêu cầu tìm kiếm nâng cao
     * @param pageable      Thông tin phân trang
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
            predicates.add(criteriaBuilder.equal(root.get("deleted"), false));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        // Thực hiện tìm kiếm với Specification và Pageable
        Page<Manga> mangaPage = mangaRepository.findAll(spec, pageable);

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

            // Nếu có lastChapterId, tìm chapter tương ứng để lấy chapterNumber
            if (manga.getLastChapterId() != null) {
                chapterRepository.findById(manga.getLastChapterId()).ifPresent(chapter -> {
                    response.setLastChapterNumber(chapter.getChapterNumber());
                });
            }

            return response;
        });
    }

    /**
     * Tìm kiếm manga theo từ khóa
     *
     * @param keyword  Từ khóa tìm kiếm
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
     *
     * @param genreName Tên thể loại
     * @param pageable  Thông tin phân trang
     * @return Danh sách manga thuộc thể loại
     */
    public Page<MangaSummaryResponse> findByGenre(String genreName, Pageable pageable) {
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
            MangaSummaryResponse response = mangaMapper.toMangaSummaryResponse(manga);

            // Nếu có lastChapterId, tìm chapter tương ứng để lấy chapterNumber
            if (manga.getLastChapterId() != null) {
                chapterRepository.findById(manga.getLastChapterId()).ifPresent(chapter -> {
                    response.setLastChapterNumber(chapter.getChapterNumber());
                });
            }

            return response;
        });
    }

    /**
     * Lấy số chapter cao nhất của một truyện
     *
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
     *
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

//    /**
//     * Lấy danh sách truyện được xem nhiều nhất
//     *
//     * @param limit Số lượng truyện cần lấy
//     * @return Danh sách truyện được xem nhiều nhất
//     */
//    public List<MostViewedMangaResponse> getMostViewedMangas(int limit) {
//        log.info("Getting {} most viewed mangas", limit);
//
//        // Lấy danh sách truyện được xem nhiều nhất
//        Pageable pageable = PageRequest.of(0, limit);
//        List<Manga> mostViewedMangas = mangaRepository.findByOrderByViewsDesc(pageable);
//
//        // Chuyển đổi sang response
//        return mostViewedMangas.stream()
//                .map(manga -> {
//                    // Lấy thể loại chính của truyện (nếu có)
//                    String mainGenre = manga.getGenres().isEmpty() ? "" :
//                            manga.getGenres().iterator().next().getName();
//
//                    return MostViewedMangaResponse.builder()
//                            .id(manga.getId())
//                            .title(manga.getTitle())
//                            .views(manga.getViews())
//                            .author(manga.getAuthor())
//                            .mainGenre(mainGenre)
//                            .build();
//                })
//                .collect(Collectors.toList());
//    }

    /**
     * Lấy thống kê tổng hợp về truyện
     *
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

        // Đếm số truyện theo trạng thái (hiệu quả hơn)
        List<Manga> activeMangas2 = mangaRepository.findByDeletedFalse();
        Map<String, Long> mangasByStatus = new HashMap<>();

        // Khởi tạo với giá trị 0 cho tất cả status
        mangasByStatus.put("ONGOING", 0L);
        mangasByStatus.put("COMPLETED", 0L);
        mangasByStatus.put("PAUSED", 0L);

        // Đếm theo từng status
        for (Manga manga : activeMangas2) {
            if (manga.getStatus() != null) {
                String statusKey = manga.getStatus().name();
                mangasByStatus.put(statusKey, mangasByStatus.getOrDefault(statusKey, 0L) + 1);
            }
        }

        log.info("Manga by status: {}", mangasByStatus);

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

    /**
     * Tìm kiếm nhanh truyện theo từ khóa, dùng cho việc thêm chapter
     *
     * @param keyword Từ khóa tìm kiếm
     * @param limit   Số lượng kết quả tối đa
     * @return Danh sách truyện đơn giản phù hợp với từ khóa
     */
    public List<MangaQuickSearchResponse> quickSearchManga(String keyword, int limit) {
        log.info("Quick searching manga with keyword: {}", keyword);

        // Thực hiện tìm kiếm với từ khóa
        List<Manga> mangas = mangaRepository.searchByKeyword(keyword, PageRequest.of(0, limit)).getContent();
        log.info("Found {} mangas matching the keyword", mangas.size());

        // Chuyển đổi kết quả sang DTO đơn giản
        return mangas.stream()
                .map(manga -> {
                    // Lấy số chapter cao nhất
                    double highestChapterNumber = getHighestChapterNumber(manga.getId());

                    return MangaQuickSearchResponse.builder()
                            .id(manga.getId())
                            .title(manga.getTitle())
                            .author(manga.getAuthor())
                            .coverUrl(manga.getCoverUrl())
                            .highestChapterNumber(highestChapterNumber)
                            .chapterCount(chapterRepository.countByMangaId(manga.getId()))
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Tìm kiếm và lọc manga chưa bị xóa theo nhiều tiêu chí
     *
     * @param keyword       Từ khóa tìm kiếm (title hoặc author)
     * @param genreName     Tên thể loại cần lọc (null nếu không lọc theo thể loại)
     * @param status        Trạng thái manga cần lọc (null nếu không lọc theo trạng thái)
     * @param yearOfRelease Năm phát hành cần lọc (null nếu không lọc theo năm)
     * @param pageable      Thông tin phân trang
     * @return Danh sách manga chưa bị xóa đã được lọc
     */
    public Page<MangaManagementResponse> searchAndFilterActiveMangas(
            String keyword,
            String genreName,
            String status,
            Integer yearOfRelease,
            Pageable pageable) {

        log.info("Searching and filtering active mangas with criteria - keyword: {}, genreName: {}, status: {}, yearOfRelease: {}",
                keyword, genreName, status, yearOfRelease);

        // Xử lý trường hợp chuỗi tìm kiếm rỗng
        keyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        genreName = (genreName != null && !genreName.trim().isEmpty()) ? genreName.trim() : null;

        // Convert String status to MangaStatus enum
        MangaStatus mangaStatus = null;
        if (status != null && !status.trim().isEmpty()) {
            try {
                mangaStatus = MangaStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status value: {}", status);
                // Nếu status không hợp lệ, set về null để không lọc theo status
                mangaStatus = null;
            }
        }

        Page<Manga> mangas = mangaRepository.searchAndFilterActiveMangas(keyword, genreName, mangaStatus, yearOfRelease, pageable);

        Page<MangaManagementResponse> mangaResponsePage = mangas.map(manga -> {
            MangaManagementResponse response = mangaMapper.toMangaManagementResponse(manga);
            response.setChapters(chapterRepository.countByMangaId(manga.getId()));
            return response;
        });

        log.info("Found {} active mangas matching the criteria", mangaResponsePage.getTotalElements());
        return mangaResponsePage;
    }

    /**
     * Tìm kiếm và lọc manga đã bị xóa theo nhiều tiêu chí
     *
     * @param keyword       Từ khóa tìm kiếm (title hoặc author)
     * @param genreName     Tên thể loại cần lọc (null nếu không lọc theo thể loại)
     * @param status        Trạng thái manga cần lọc (null nếu không lọc theo trạng thái)
     * @param yearOfRelease Năm phát hành cần lọc (null nếu không lọc theo năm)
     * @param pageable      Thông tin phân trang
     * @return Danh sách manga đã bị xóa đã được lọc
     */
    public Page<MangaManagementResponse> searchAndFilterDeletedMangas(
            String keyword,
            String genreName,
            String status,
            Integer yearOfRelease,
            Pageable pageable) {

        log.info("Searching and filtering deleted mangas with criteria - keyword: {}, genreName: {}, status: {}, yearOfRelease: {}",
                keyword, genreName, status, yearOfRelease);

        // Xử lý các tham số đầu vào
        keyword = trimOrNull(keyword);
        genreName = trimOrNull(genreName);
        MangaStatus mangaStatus = parseStatusOrNull(status);

        // Gọi repository để lấy dữ liệu
        Page<Manga> mangas = mangaRepository.searchAndFilterDeletedMangas(
                keyword, genreName, mangaStatus, yearOfRelease, pageable);

        // Chuyển đổi kết quả sang MangaManagementResponse
        Page<MangaManagementResponse> mangaResponsePage = mangas.map(manga -> {
            MangaManagementResponse response = mangaMapper.toMangaManagementResponse(manga);
            response.setChapters(chapterRepository.countByMangaId(manga.getId()));
            return response;
        });

        log.info("Found {} deleted mangas matching the criteria", mangaResponsePage.getTotalElements());
        return mangaResponsePage;
    }

    /**
     * Chuỗi null hoặc rỗng sẽ trả về null, ngược lại trả về chuỗi đã cắt khoảng trắng
     */
    private String trimOrNull(String str) {
        return (str != null && !str.trim().isEmpty()) ? str.trim() : null;
    }

    /**
     * Chuyển đổi String thành MangaStatus hoặc null nếu không hợp lệ
     */
    private MangaStatus parseStatusOrNull(String status) {
        if (status == null || status.trim().isEmpty()) {
            return null;
        }

        try {
            return MangaStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid status value: {}", status);
            return null;
        }
    }
}
