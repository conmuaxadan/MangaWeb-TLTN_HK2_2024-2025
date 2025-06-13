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
import org.springframework.data.domain.Sort;
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
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

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
    MangaCacheService mangaCacheService;

    // ==================== BATCH QUERY HELPER METHODS ====================

    private String createSearchHash(AdvancedSearchRequest searchRequest) {
        try {
            String searchString = String.format("%s|%s|%s|%s|%s",
                    searchRequest.getTitle() != null ? searchRequest.getTitle() : "",
                    searchRequest.getAuthor() != null ? searchRequest.getAuthor() : "",
                    searchRequest.getGenres() != null ? String.join(",", searchRequest.getGenres()) : "",
                    searchRequest.getYearOfRelease() != null ? searchRequest.getYearOfRelease().toString() : "",
                    searchRequest.getStatus() != null ? searchRequest.getStatus().toString() : ""
            );

            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] hash = digest.digest(searchString.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.warn("Error creating search hash: {}", e.getMessage());
            return searchRequest.toString().hashCode() + "";
        }
    }    private Map<String, Double> getLastChapterNumbersMap(List<String> mangaIds) {
        if (mangaIds.isEmpty()) return Collections.emptyMap();
        return mangaRepository.findLastChapterNumbersByMangaIds(mangaIds).stream()
                .filter(row -> row[1] != null) // Filter out null chapter numbers
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
        // Kiểm tra cache trước
        try {
            MangaResponse cachedResult = mangaCacheService.getMangaByIdFromCache(id);
            if (cachedResult != null) {
                return cachedResult;
            }
        } catch (Exception e) {
            log.warn("Cache error for manga ID {}: {}", id, e.getMessage());
        }

        // Nếu không có trong cache, query từ database
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

        // Lưu vào cache
        try {
            mangaCacheService.saveMangaByIdToCache(id, response);
        } catch (Exception e) {
            log.warn("Cache save error for manga ID {}: {}", id, e.getMessage());
        }

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
        // Tạo sort string để làm cache key
        String sortString = pageable.getSort().toString();

        // Kiểm tra cache trước
        try {
            Page<MangaSummaryResponse> cachedResult = mangaCacheService.getMangaSummariesFromCache(pageable, sortString);
            if (cachedResult != null) {
                return cachedResult;
            }
        } catch (Exception e) {
            log.warn("Cache error for manga summaries: {}", e.getMessage());
        }

        // Query từ database
        Page<Manga> mangasPage = mangaRepository.findByDeletedFalse(pageable);
        List<String> mangaIds = mangasPage.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, Double> lastChapterMap = getLastChapterNumbersMap(mangaIds);
        Page<MangaSummaryResponse> result = mangasPage.map(manga -> enrichSummaryResponse(manga, lastChapterMap));

        // Lưu vào cache
        try {
            mangaCacheService.saveMangaSummariesToCache(pageable, sortString, result);
        } catch (Exception e) {
            log.warn("Cache save error for manga summaries: {}", e.getMessage());
        }

        return result;
    }

    public Page<MangaSummaryResponse> getLatestUpdates(Pageable pageable) {
        // Tạo Pageable với sort theo lastChapterAddedAt desc
        Pageable latestUpdatesPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "lastChapterAddedAt")
        );

        try {
            Page<MangaSummaryResponse> cachedResult = mangaCacheService.getLatestUpdatesFromCache(latestUpdatesPageable);
            if (cachedResult != null) {
                return cachedResult;
            }
        } catch (Exception e) {
            log.warn("Cache error: {}", e.getMessage());
        }

        Page<Manga> mangasPage = mangaRepository.findByDeletedFalse(latestUpdatesPageable);
        List<String> mangaIds = mangasPage.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, Double> lastChapterMap = getLastChapterNumbersMap(mangaIds);
        Page<MangaSummaryResponse> result = mangasPage.map(manga -> enrichSummaryResponse(manga, lastChapterMap));

        try {
            mangaCacheService.saveLatestUpdatesToCache(latestUpdatesPageable, result);
        } catch (Exception e) {
            log.warn("Cache save error: {}", e.getMessage());
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

        // Xử lý genres
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

    public Page<MangaSummaryResponse> advancedSearch(AdvancedSearchRequest searchRequest, Pageable pageable) {
        // Tạo hash cho search request để làm cache key
        String searchHash = createSearchHash(searchRequest);

        // Kiểm tra cache trước
        try {
            Page<MangaSummaryResponse> cachedResult = mangaCacheService.getAdvancedSearchSummaryFromCache(searchHash, pageable);
            if (cachedResult != null) {
                return cachedResult;
            }
        } catch (Exception e) {
            log.warn("Cache error for advanced search: {}", e.getMessage());
        }

        // Tạo Specification và thực hiện tìm kiếm
        Specification<Manga> spec = buildAdvancedSearchSpecification(searchRequest);
        Page<Manga> mangaPage = mangaRepository.findAll(spec, pageable);

        // Chuyển đổi kết quả sang DTO
        Page<MangaSummaryResponse> result = enrichAdvancedSearchSummaryResults(mangaPage);

        // Lưu vào cache
        try {
            mangaCacheService.saveAdvancedSearchSummaryToCache(searchHash, pageable, result);
        } catch (Exception e) {
            log.warn("Cache save error for advanced search: {}", e.getMessage());
        }

        return result;
    }

    /**
     * Xây dựng Specification cho advanced search
     */
    private Specification<Manga> buildAdvancedSearchSpecification(AdvancedSearchRequest searchRequest) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Thêm các điều kiện tìm kiếm
            if (searchRequest.getTitle() != null && !searchRequest.getTitle().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("title")),
                        "%" + searchRequest.getTitle().toLowerCase() + "%"));
            }

            if (searchRequest.getAuthor() != null && !searchRequest.getAuthor().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("author")),
                        "%" + searchRequest.getAuthor().toLowerCase() + "%"));
            }
            if (searchRequest.getGenres() != null && !searchRequest.getGenres().isEmpty()) {
                // Tạo subquery để đếm số lượng thể loại khớp
                Subquery<Long> subquery = query.subquery(Long.class);
                Root<Manga> subRoot = subquery.correlate(root);
                Join<Manga, Genre> genreJoin = subRoot.join("genres", JoinType.INNER);

                subquery.select(criteriaBuilder.count(genreJoin.get("name")))
                        .where(genreJoin.get("name").in(searchRequest.getGenres()));

                // Manga phải chứa đúng số lượng thể loại được yêu cầu
                predicates.add(criteriaBuilder.equal(subquery, (long) searchRequest.getGenres().size()));
            }

            if (searchRequest.getYearOfRelease() != null) {
                predicates.add(criteriaBuilder.equal(root.get("yearOfRelease"), searchRequest.getYearOfRelease()));
            }
            if (searchRequest.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), searchRequest.getStatus()));
            }

            // Luôn lọc manga chưa bị xóa
            predicates.add(criteriaBuilder.equal(root.get("deleted"), false));
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Page<MangaSummaryResponse> enrichAdvancedSearchSummaryResults(Page<Manga> mangaPage) {
        // Batch queries để lấy last chapter data
        List<String> mangaIds = mangaPage.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, Double> lastChapterMap = getLastChapterNumbersMap(mangaIds);

        // Chuyển đổi kết quả sang DTO với batch data
        return mangaPage.map(manga -> enrichSummaryResponse(manga, lastChapterMap));
    }

    private Page<MangaResponse> enrichAdvancedSearchResults(Page<Manga> mangaPage) {
        // Batch queries để lấy chapter data
        List<String> mangaIds = mangaPage.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, List<String>> chapterIdsMap = getChapterIdsMap(mangaIds);
        Map<String, Double> lastChapterMap = getLastChapterNumbersMap(mangaIds);

        // Chuyển đổi kết quả sang DTO với batch data
        return mangaPage.map(manga -> enrichMangaResponse(manga, chapterIdsMap, lastChapterMap));
    }

    public Page<MangaResponse> searchByKeyword(String keyword, Pageable pageable) {
        // Kiểm tra cache trước
        try {
            Page<MangaResponse> cachedResult = mangaCacheService.getSearchFromCache(keyword, pageable);
            if (cachedResult != null) {
                return cachedResult;
            }
        } catch (Exception e) {
            log.warn("Cache error for search keyword '{}': {}", keyword, e.getMessage());
        }

        // Nếu không có trong cache, query từ database
        Page<Manga> mangaPage = mangaRepository.searchByKeyword(keyword, pageable);

        // Batch query để lấy chapter IDs
        List<String> mangaIds = mangaPage.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, List<String>> chapterIdsMap = getChapterIdsMap(mangaIds);

        // Chuyển đổi kết quả sang DTO với batch data
        Page<MangaResponse> result = mangaPage.map(manga -> {
            MangaResponse response = mangaMapper.toMangaResponse(manga);
            List<String> chapterIds = chapterIdsMap.getOrDefault(manga.getId(), Collections.emptyList());
            response.setChapters(chapterIds);
            return response;
        });

        // Lưu vào cache
        try {
            mangaCacheService.saveSearchToCache(keyword, pageable, result);
        } catch (Exception e) {
            log.warn("Cache save error for search keyword '{}': {}", keyword, e.getMessage());
        }

        return result;
    }

    public Page<MangaSummaryResponse> findByGenre(String genreName, Pageable pageable) {
        // Kiểm tra cache trước
        try {
            Page<MangaSummaryResponse> cachedResult = mangaCacheService.getByGenreFromCache(genreName, pageable);
            if (cachedResult != null) {
                return cachedResult;
            }
        } catch (Exception e) {
            log.warn("Cache error for genre '{}': {}", genreName, e.getMessage());
        }

        // Validate genre exists
        Genre genre = genreRepository.findByName(genreName);
        if (genre == null) {
            throw new AppException(ErrorCode.GENRE_NOT_FOUND);
        }

        // Query từ database
        Page<Manga> mangaPage = mangaRepository.findByGenre(genreName, pageable);
        List<String> mangaIds = mangaPage.getContent().stream().map(Manga::getId).collect(Collectors.toList());
        Map<String, Double> lastChapterMap = getLastChapterNumbersMap(mangaIds);
        Page<MangaSummaryResponse> result = mangaPage.map(manga -> enrichSummaryResponse(manga, lastChapterMap));

        // Lưu vào cache
        try {
            mangaCacheService.saveByGenreToCache(genreName, pageable, result);
        } catch (Exception e) {
            log.warn("Cache save error for genre '{}': {}", genreName, e.getMessage());
        }

        return result;
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
        try {
            List<Object[]> results = mangaRepository.countMangasByGenre();
            return results.stream()
                    .collect(Collectors.toMap(
                            row -> (String) row[0],
                            row -> ((Number) row[1]).longValue(),
                            (existing, replacement) -> existing, // Giữ giá trị đầu tiên nếu có duplicate key
                            LinkedHashMap::new // Giữ thứ tự sắp xếp từ query
                    ));
        } catch (Exception e) {
            log.error("Error getting manga statistics by genre: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private Map<String, Long> getMangasByStatusStatistics() {
        try {
            // Khởi tạo map với tất cả status có giá trị 0
            Map<String, Long> result = new LinkedHashMap<>();
            result.put("ONGOING", 0L);
            result.put("COMPLETED", 0L);
            result.put("PAUSED", 0L);

            // Lấy dữ liệu thực tế từ database
            List<Object[]> results = mangaRepository.countMangasByStatus();
            for (Object[] row : results) {
                String status = row[0].toString();
                Long count = ((Number) row[1]).longValue();
                result.put(status, count);
            }

            return result;
        } catch (Exception e) {
            log.error("Error getting manga statistics by status: {}", e.getMessage());
            // Trả về map mặc định với tất cả status = 0
            Map<String, Long> defaultResult = new LinkedHashMap<>();
            defaultResult.put("ONGOING", 0L);
            defaultResult.put("COMPLETED", 0L);
            defaultResult.put("PAUSED", 0L);
            return defaultResult;
        }
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
