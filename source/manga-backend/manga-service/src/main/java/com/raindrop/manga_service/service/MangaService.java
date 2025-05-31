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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.*;
import java.util.stream.Collectors;
import java.util.Comparator;
import java.util.Collection;

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

    // ==================== BATCH QUERY HELPER METHODS ====================

    private Map<String, Double> getLastChapterNumbersMap(List<String> mangaIds) {
        if (mangaIds.isEmpty()) return Collections.emptyMap();
        return mangaRepository.findLastChapterNumbersByMangaIds(mangaIds).stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> (Double) row[1]));
    }

    private Map<String, Integer> getChapterCountsMap(List<String> mangaIds) {
        if (mangaIds.isEmpty()) return Collections.emptyMap();
        return mangaRepository.findChapterCountsByMangaIds(mangaIds).stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> ((Long) row[1]).intValue()));
    }

    private Map<String, List<String>> getChapterIdsMap(List<String> mangaIds) {
        if (mangaIds.isEmpty()) return Collections.emptyMap();

        Map<String, List<String>> result = new HashMap<>();
        mangaRepository.findChapterIdsByMangaIds(mangaIds).forEach(row -> {
            String mangaId = (String) row[0];
            String chapterId = (String) row[1];
            result.computeIfAbsent(mangaId, k -> new ArrayList<>()).add(chapterId);
        });
        return result;
    }

    // ==================== RESPONSE ENRICHMENT METHODS ====================

    private MangaResponse enrichMangaResponse(Manga manga, Map<String, List<String>> chapterIdsMap, Map<String, Double> lastChapterMap) {
        MangaResponse response = mangaMapper.toMangaResponse(manga);

        // Set chapter IDs
        List<String> chapterIds = chapterIdsMap.getOrDefault(manga.getId(), Collections.emptyList());
        response.setChapters(chapterIds);

        // Set last chapter number
        Double lastChapterNumber = lastChapterMap.get(manga.getId());
        if (lastChapterNumber != null) {
            response.setLastChapterNumber(lastChapterNumber);
        }

        return response;
    }

    private MangaSummaryResponse enrichSummaryResponse(Manga manga, Map<String, Double> lastChapterMap) {
        MangaSummaryResponse response = mangaMapper.toMangaSummaryResponse(manga);

        // Set last chapter number
        Double lastChapterNumber = lastChapterMap.get(manga.getId());
        if (lastChapterNumber != null) {
            response.setLastChapterNumber(lastChapterNumber);
        }

        return response;
    }

    private MangaManagementResponse enrichManagementResponse(Manga manga, Map<String, Integer> chapterCountsMap) {
        MangaManagementResponse response = mangaMapper.toMangaManagementResponse(manga);

        // Set chapter count
        Integer chapterCount = chapterCountsMap.getOrDefault(manga.getId(), 0);
        response.setChapters(chapterCount);

        return response;
    }

    @Transactional
    public MangaResponse createManga(MangaRequest request) {
        // Kiểm tra xem manga đã tồn tại chưa
        Manga existingManga = mangaRepository.findByTitle(request.getTitle());
        if (existingManga != null) {
            throw new AppException(ErrorCode.MANGA_ALREADY_EXISTS);
        }
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        var header = attributes.getRequest().getHeader("Authorization");

        // Lấy thông tin người dùng hiện tại
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = authentication.getName();

        var manga = mangaMapper.toManga(request);

        // Thiết lập người tạo
        manga.setCreatedBy(currentUserId);

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
        Page<Manga> mangasPage = mangaRepository.findByDeletedFalse(pageable);
        List<String> mangaIds = mangasPage.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, Integer> chapterCountsMap = getChapterCountsMap(mangaIds);
        return mangasPage.map(manga -> enrichManagementResponse(manga, chapterCountsMap));
    }

    public Page<MangaManagementResponse> getAllDeletedMangas(Pageable pageable) {
        Page<Manga> mangasPage = mangaRepository.findByDeletedTrue(pageable);
        List<String> mangaIds = mangasPage.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, Integer> chapterCountsMap = getChapterCountsMap(mangaIds);
        return mangasPage.map(manga -> enrichManagementResponse(manga, chapterCountsMap));
    }


    public Page<MangaResponse> getAllDeletedMangasPaginated(Pageable pageable) {
        Page<Manga> mangasPage = mangaRepository.findByDeletedTrue(pageable);
        return mangasPage.map(mangaMapper::toMangaResponse);
    }

    public Page<MangaSummaryResponse> getMangaSummariesPaginated(Pageable pageable) {
        boolean isLatestUpdatesRequest = pageable.getSort().stream()
                .anyMatch(order -> "lastChapterAddedAt".equals(order.getProperty()) &&
                                 order.getDirection().isDescending());

        if (isLatestUpdatesRequest) {
            try {
                Page<MangaSummaryResponse> cachedResult = mangaSummariesRedisService.getFromCache(pageable);
                if (cachedResult != null) {
                    return cachedResult;
                }
            } catch (Exception e) {
                log.warn("Cache error: {}", e.getMessage());
            }
        }

        Page<Manga> mangasPage = mangaRepository.findByDeletedFalse(pageable);
        List<String> mangaIds = mangasPage.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, Double> lastChapterMap = getLastChapterNumbersMap(mangaIds);
        Page<MangaSummaryResponse> result = mangasPage.map(manga -> enrichSummaryResponse(manga, lastChapterMap));

        if (isLatestUpdatesRequest) {
            try {
                mangaSummariesRedisService.saveToCache(pageable, result);
            } catch (Exception e) {
                log.warn("Cache save error: {}", e.getMessage());
            }
        }

        return result;
    }

    @Transactional
    public void softDeleteManga(String id, String userId) {
        var manga = mangaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        if (manga.isDeleted()) {
            throw new AppException(ErrorCode.MANGA_ALREADY_DELETED);
        }

        manga.setDeleted(true);
        manga.setDeletedAt(java.time.LocalDateTime.now());
        manga.setDeletedBy(userId);
        mangaRepository.save(manga);
    }

    @Transactional
    public MangaResponse restoreManga(String id) {
        var manga = mangaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        if (!manga.isDeleted()) {
            throw new AppException(ErrorCode.MANGA_NOT_DELETED);
        }

        manga.setDeleted(false);
        manga.setDeletedAt(null);
        manga.setDeletedBy(null);
        manga = mangaRepository.save(manga);

        return mangaMapper.toMangaResponse(manga);
    }

    @Transactional
    public void hardDeleteManga(String id) {
        var manga = mangaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        Set<Chapter> chapters = chapterRepository.findByManga(manga);
        for (Chapter chapter : chapters) {
            chapterRepository.delete(chapter);
        }

        manga.getGenres().clear();
        mangaRepository.save(manga);
        mangaRepository.delete(manga);
    }

    @Transactional
    public void deleteManga(String id, String userId) {
        // Kiểm tra quyền sở hữu cho translator
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        boolean hasTranslatorManagement = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("TRANSLATOR_MANAGEMENT"));
        boolean hasMangaManagement = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("MANGA_MANAGEMENT"));

        // Nếu chỉ có quyền TRANSLATOR_MANAGEMENT, kiểm tra quyền sở hữu
        if (hasTranslatorManagement && !hasMangaManagement) {
            checkOwnership(id, userId);
        }

        softDeleteManga(id, userId);
    }

    public MangaResponse updateManga(String id, MangaRequest request) {
        var manga = mangaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        // Kiểm tra quyền sở hữu
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = authentication.getName();
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        boolean hasTranslatorManagement = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("TRANSLATOR_MANAGEMENT"));
        boolean hasMangaManagement = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("MANGA_MANAGEMENT"));

        // Nếu chỉ có quyền TRANSLATOR_MANAGEMENT, kiểm tra quyền sở hữu
        if (hasTranslatorManagement && !hasMangaManagement &&
            !manga.getCreatedBy().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_OPERATION);
        }

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

    public Page<MangaResponse> advancedSearch(AdvancedSearchRequest searchRequest, Pageable pageable) {

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

        // Batch queries để lấy chapter data
        List<String> mangaIds = mangaPage.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, List<String>> chapterIdsMap = getChapterIdsMap(mangaIds);
        Map<String, Double> lastChapterMap = getLastChapterNumbersMap(mangaIds);

        // Chuyển đổi kết quả sang DTO với batch data
        return mangaPage.map(manga -> enrichMangaResponse(manga, chapterIdsMap, lastChapterMap));
    }

    public Page<MangaResponse> searchByKeyword(String keyword, Pageable pageable) {
        Page<Manga> mangaPage = mangaRepository.searchByKeyword(keyword, pageable);

        // Batch query để lấy chapter IDs
        List<String> mangaIds = mangaPage.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, List<String>> chapterIdsMap = getChapterIdsMap(mangaIds);

        // Chuyển đổi kết quả sang DTO với batch data
        return mangaPage.map(manga -> {
            MangaResponse response = mangaMapper.toMangaResponse(manga);
            List<String> chapterIds = chapterIdsMap.getOrDefault(manga.getId(), Collections.emptyList());
            response.setChapters(chapterIds);
            return response;
        });
    }

    public Page<MangaSummaryResponse> findByGenre(String genreName, Pageable pageable) {
        Genre genre = genreRepository.findByName(genreName);
        if (genre == null) {
            throw new AppException(ErrorCode.GENRE_NOT_FOUND);
        }

        Page<Manga> mangaPage = mangaRepository.findByGenre(genreName, pageable);
        List<String> mangaIds = mangaPage.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, Double> lastChapterMap = getLastChapterNumbersMap(mangaIds);
        return mangaPage.map(manga -> enrichSummaryResponse(manga, lastChapterMap));
    }

    public Double getHighestChapterNumber(String mangaId) {
        Manga manga = mangaRepository.findById(mangaId)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        List<Chapter> chapters = chapterRepository.findByMangaId(mangaId);
        if (chapters.isEmpty()) {
            return 0.0;
        }

        return chapters.stream()
                .mapToDouble(Chapter::getChapterNumber)
                .max()
                .orElse(0);
    }

    public Long countMangas(boolean includeDeleted) {
        return includeDeleted ? mangaRepository.count() : mangaRepository.countActiveMangas();
    }

    public MangaStatisticsResponse getMangaStatistics() {
        long totalMangas = mangaRepository.count();
        long activeMangas = mangaRepository.countActiveMangas();
        long deletedMangas = mangaRepository.countDeletedMangas();
        long newMangasToday = mangaRepository.countNewMangasToday();

        Map<String, Long> mangasByGenre = getMangasByGenreStatistics();
        Map<String, Long> mangasByStatus = getMangasByStatusStatistics();

        return MangaStatisticsResponse.builder()
                .totalMangas(totalMangas)
                .activeMangas(activeMangas)
                .deletedMangas(deletedMangas)
                .newMangasToday(newMangasToday)
                .mangasByGenre(mangasByGenre)
                .mangasByStatus(mangasByStatus)
                .build();
    }

    private Map<String, Long> getMangasByGenreStatistics() {
        return Collections.emptyMap();
    }

    private Map<String, Long> getMangasByStatusStatistics() {
        Map<String, Long> result = new HashMap<>();
        result.put("ONGOING", 0L);
        result.put("COMPLETED", 0L);
        result.put("PAUSED", 0L);
        return result;
    }

    public List<MangaQuickSearchResponse> quickSearchManga(String keyword, int limit) {
        List<Manga> mangas = mangaRepository.searchByKeyword(keyword, PageRequest.of(0, limit)).getContent();

        return mangas.stream()
                .map(manga -> {
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

    public List<MangaQuickSearchResponse> quickSearchMangaByCreatedBy(String keyword, int limit, String createdBy) {
        // Tìm kiếm manga theo keyword và createdBy
        List<Manga> mangas = mangaRepository.searchByKeywordAndCreatedBy(keyword, createdBy, PageRequest.of(0, limit)).getContent();

        return mangas.stream()
                .map(manga -> {
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

        keyword = trimOrNull(keyword);
        genreName = trimOrNull(genreName);
        MangaStatus mangaStatus = parseStatusOrNull(status);

        Page<Manga> mangas = mangaRepository.searchAndFilterActiveMangas(keyword, genreName, mangaStatus, yearOfRelease, pageable);

        // Batch query để lấy chapter counts
        List<String> mangaIds = mangas.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, Integer> chapterCountsMap = getChapterCountsMap(mangaIds);

        return mangas.map(manga -> enrichManagementResponse(manga, chapterCountsMap));
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

        keyword = trimOrNull(keyword);
        genreName = trimOrNull(genreName);
        MangaStatus mangaStatus = parseStatusOrNull(status);

        Page<Manga> mangas = mangaRepository.searchAndFilterDeletedMangas(
                keyword, genreName, mangaStatus, yearOfRelease, pageable);

        List<String> mangaIds = mangas.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, Integer> chapterCountsMap = getChapterCountsMap(mangaIds);

        return mangas.map(manga -> enrichManagementResponse(manga, chapterCountsMap));
    }

    private String trimOrNull(String str) {
        return (str != null && !str.trim().isEmpty()) ? str.trim() : null;
    }

    private MangaStatus parseStatusOrNull(String status) {
        if (status == null || status.trim().isEmpty()) {
            return null;
        }

        try {
            return MangaStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    // ==================== TRANSLATOR METHODS ====================

    // Thêm phương thức kiểm tra quyền sở hữu
    public void checkOwnership(String mangaId, String userId) {
        Manga manga = mangaRepository.findById(mangaId)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        if (!manga.getCreatedBy().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_OPERATION);
        }
    }

    // Lấy danh sách truyện đã xóa của translator
    public Page<MangaManagementResponse> getMyDeletedMangas(String userId, Pageable pageable) {
        Page<Manga> mangasPage = mangaRepository.findByCreatedByAndDeletedTrue(userId, pageable);
        List<String> mangaIds = mangasPage.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, Integer> chapterCountsMap = getChapterCountsMap(mangaIds);
        return mangasPage.map(manga -> enrichManagementResponse(manga, chapterCountsMap));
    }

    // Khôi phục truyện của translator
    @Transactional
    public MangaResponse restoreMyManga(String id, String userId) {
        // Kiểm tra quyền sở hữu
        checkOwnership(id, userId);

        var manga = mangaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        if (!manga.isDeleted()) {
            throw new AppException(ErrorCode.MANGA_NOT_DELETED);
        }

        manga.setDeleted(false);
        manga.setDeletedAt(null);
        manga.setDeletedBy(null);
        manga = mangaRepository.save(manga);

        return mangaMapper.toMangaResponse(manga);
    }

    // Thêm phương thức lọc truyện theo người tạo
    public Page<MangaManagementResponse> searchAndFilterMangasByCreatedBy(
            String keyword, String genreName, String statusStr, Integer yearOfRelease,
            String createdBy, Pageable pageable) {

        MangaStatus status = null;
        if (statusStr != null && !statusStr.isEmpty()) {
            try {
                status = MangaStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Bỏ qua lỗi, status vẫn là null
            }
        }

        Page<Manga> mangasPage = mangaRepository.searchAndFilterByCreatedBy(
                keyword, genreName, status, yearOfRelease, createdBy, pageable);

        List<String> mangaIds = mangasPage.getContent().stream()
                .map(Manga::getId).collect(Collectors.toList());
        Map<String, Integer> chapterCountsMap = getChapterCountsMap(mangaIds);

        return mangasPage.map(manga -> enrichManagementResponse(manga, chapterCountsMap));
    }
}
