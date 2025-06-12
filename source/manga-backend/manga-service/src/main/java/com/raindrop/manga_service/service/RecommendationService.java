package com.raindrop.manga_service.service;

import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.MangaSummaryResponse;
import com.raindrop.manga_service.entity.Genre;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.mapper.MangaMapper;
import com.raindrop.manga_service.repository.MangaRepository;
import com.raindrop.manga_service.repository.httpclient.HistoryClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RecommendationService {
    MangaRepository mangaRepository;
    HistoryClient historyClient;
    MangaMapper mangaMapper;
    MangaCacheService mangaCacheService;


    public List<MangaSummaryResponse> getRecommendationsByGenreSummary(String userId, int limit) {
        int recommendationLimit = (limit > 0) ? limit : 6;

        // Kiểm tra cache trước
        try {
            List<MangaSummaryResponse> cachedResult = mangaCacheService.getRecommendationsFromCache(userId, recommendationLimit);
            if (cachedResult != null) {
                log.debug("Cache hit for recommendations userId: {}, limit: {}", userId, recommendationLimit);
                return cachedResult;
            }
        } catch (Exception e) {
            log.warn("Cache error for recommendations userId {}, limit {}: {}", userId, recommendationLimit, e.getMessage());
        }

        try {
            // lấy tất cả manga đã đọc
            List<String> allReadMangaIds = getAllReadMangaIds(userId);
            if (allReadMangaIds.isEmpty()) return Collections.emptyList();

            // Lấy 3 manga gần đây nhất để tính toán genres
            List<String> recentMangaIds = allReadMangaIds.stream().limit(3).collect(Collectors.toList());
            List<Manga> recentMangas = mangaRepository.findAllByIdWithGenres(recentMangaIds);
            if (recentMangas.isEmpty()) return Collections.emptyList();

            List<String> topGenres = calculateTopGenres(recentMangas, 3);
            if (topGenres.isEmpty()) return Collections.emptyList();

            log.info("Top genres cho user {}: {}", userId, topGenres);

            // Tìm manga gợi ý
            List<Manga> recommendations = findMangas(topGenres, allReadMangaIds, recommendationLimit);
            List<MangaSummaryResponse> result = convertToResponses(recommendations);

            // Lưu vào cache
            try {
                mangaCacheService.saveRecommendationsToCache(userId, recommendationLimit, result);
            } catch (Exception e) {
                log.warn("Cache save error for recommendations userId {}, limit {}: {}", userId, recommendationLimit, e.getMessage());
            }

            return result;

        } catch (Exception e) {
            log.error("Lỗi gợi ý manga cho user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private String getAuthorizationHeader() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes.getRequest().getHeader("Authorization");
    }

    private List<String> getAllReadMangaIds(String userId) {
        try {
            ApiResponse<List<String>> response = historyClient.getAllReadMangaIds(getAuthorizationHeader(), userId);
            return response.getCode() == 200 && response.getResult() != null ? response.getResult() : Collections.emptyList();
        } catch (Exception e) {
            log.error("Lỗi lấy manga đã đọc: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<String> calculateTopGenres(List<Manga> mangas, int topCount) {
        // Tạo map để lưu trữ điểm số cho mỗi thể loại
        Map<String, Double> genreScores = new HashMap<>();

        for (int i = 0; i < mangas.size(); i++) {
            Manga manga = mangas.get(i);
            // Trọng số giảm dần
            double weight = 1.0 - (0.1 * i);
            
            // Tính điểm cho các thể loại
            for (Genre genre : manga.getGenres()) {
                String genreName = genre.getName();
                genreScores.put(genreName, genreScores.getOrDefault(genreName, 0.0) + weight);
            }
        }
        
        // Sắp xếp thể loại theo điểm số và lấy top
        return genreScores.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(topCount)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private List<Manga> findMangas(List<String> topGenres, List<String> excludeIds, int limit) {
        Map<String, Manga> found = new LinkedHashMap<>();
        Set<String> exclude = new HashSet<>(excludeIds);

        for (int genreCount = topGenres.size(); genreCount > 0 && found.size() < limit; genreCount--) {
            List<String> genres = topGenres.subList(0, genreCount);
            List<Manga> results = findMangasByGenres(genres, new ArrayList<>(exclude), limit - found.size());

            results.stream()
                    .filter(manga -> !found.containsKey(manga.getId()))
                    .forEach(manga -> {
                        found.put(manga.getId(), manga);
                        exclude.add(manga.getId());
                    });

            log.info("Với {} thể loại {}: +{} manga (tổng: {})",
                    genreCount, genres, results.size(), found.size());
        }

        return new ArrayList<>(found.values());
    }

    private List<Manga> findMangasByGenres(List<String> genres, List<String> excludeIds, int limit) {
        if (excludeIds.isEmpty()) {
            excludeIds = List.of("no-manga-id"); // Tránh lỗi SQL
        }
        return mangaRepository.findMangasByAllGenres(
                genres, genres.size(), excludeIds, PageRequest.of(0, limit));
    }

    private List<MangaSummaryResponse> convertToResponses(List<Manga> mangas) {
        if (mangas.isEmpty()) return Collections.emptyList();

        Map<String, Double> chapterMap = getLastChapterNumbers(mangas.stream().map(Manga::getId).collect(Collectors.toList()));

        return mangas.stream()
                .map(manga -> {
                    MangaSummaryResponse response = mangaMapper.toMangaSummaryResponse(manga);
                    Optional.ofNullable(chapterMap.get(manga.getId())).ifPresent(response::setLastChapterNumber);
                    return response;
                })
                .collect(Collectors.toList());
    }    private Map<String, Double> getLastChapterNumbers(List<String> mangaIds) {
        try {
            return mangaRepository.findLastChapterNumbersByMangaIds(mangaIds).stream()
                    .filter(row -> row[1] != null) // Filter out null chapter numbers
                    .collect(Collectors.toMap(row -> (String) row[0], row -> (Double) row[1]));
        } catch (Exception e) {
            log.warn("Lỗi lấy lastChapterNumber: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}
