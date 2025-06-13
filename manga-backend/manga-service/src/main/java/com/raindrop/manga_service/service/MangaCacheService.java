package com.raindrop.manga_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.raindrop.manga_service.dto.response.MangaResponse;
import com.raindrop.manga_service.dto.response.MangaSummaryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MangaCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    // Cache TTL: 1 phút = 60 giây
    private static final long CACHE_TTL_SECONDS = 60;

    // Cache prefixes
    private static final String MANGA_BY_ID_PREFIX = "manga:id:";
    private static final String MANGA_SEARCH_PREFIX = "manga:search:";
    private static final String MANGA_ADVANCED_SEARCH_PREFIX = "manga:advanced_search:";
    private static final String MANGA_BY_GENRE_PREFIX = "manga:genre:";
    private static final String LATEST_UPDATES_PREFIX = "latest_updates:";
    private static final String MANGA_SUMMARIES_PREFIX = "manga:summaries:";
    private static final String RECOMMENDATIONS_PREFIX = "recommendations:";

    // Suffixes
    private static final String CONTENT_SUFFIX = ":content";
    private static final String TOTAL_PAGES_SUFFIX = ":total_pages";
    private static final String TOTAL_ELEMENTS_SUFFIX = ":total_elements";

    // ==================== MANGA BY ID CACHE ====================

    public MangaResponse getMangaByIdFromCache(String mangaId) {
        try {
            String key = MANGA_BY_ID_PREFIX + mangaId;
            Object cachedData = redisTemplate.opsForValue().get(key);
            
            if (cachedData == null) {
                return null;
            }

            return objectMapper.readValue(cachedData.toString(), MangaResponse.class);
        } catch (Exception e) {
            log.warn("Cache get error for manga ID {}: {}", mangaId, e.getMessage());
            return null;
        }
    }

    public void saveMangaByIdToCache(String mangaId, MangaResponse manga) {
        try {
            String key = MANGA_BY_ID_PREFIX + mangaId;
            String mangaJson = objectMapper.writeValueAsString(manga);
            redisTemplate.opsForValue().set(key, mangaJson, CACHE_TTL_SECONDS, TimeUnit.SECONDS);
        } catch (JsonProcessingException e) {
            log.warn("Cache save error for manga ID {}: {}", mangaId, e.getMessage());
        }
    }

    // ==================== SEARCH CACHE ====================

    public Page<MangaResponse> getSearchFromCache(String keyword, Pageable pageable) {
        return getPageFromCache(MANGA_SEARCH_PREFIX, keyword + ":page:" + pageable.getPageNumber() + ":size:" + pageable.getPageSize(), pageable, MangaResponse.class);
    }

    public void saveSearchToCache(String keyword, Pageable pageable, Page<MangaResponse> result) {
        savePageToCache(MANGA_SEARCH_PREFIX, keyword + ":page:" + pageable.getPageNumber() + ":size:" + pageable.getPageSize(), result);
    }

    // ==================== ADVANCED SEARCH CACHE ====================

    public Page<MangaResponse> getAdvancedSearchFromCache(String searchHash, Pageable pageable) {
        return getPageFromCache(MANGA_ADVANCED_SEARCH_PREFIX, searchHash + ":page:" + pageable.getPageNumber() + ":size:" + pageable.getPageSize(), pageable, MangaResponse.class);
    }

    public void saveAdvancedSearchToCache(String searchHash, Pageable pageable, Page<MangaResponse> result) {
        savePageToCache(MANGA_ADVANCED_SEARCH_PREFIX, searchHash + ":page:" + pageable.getPageNumber() + ":size:" + pageable.getPageSize(), result);
    }

    // ==================== ADVANCED SEARCH SUMMARY CACHE ====================

    public Page<MangaSummaryResponse> getAdvancedSearchSummaryFromCache(String searchHash, Pageable pageable) {
        return getPageFromCache(MANGA_ADVANCED_SEARCH_PREFIX, "summary:" + searchHash + ":page:" + pageable.getPageNumber() + ":size:" + pageable.getPageSize(), pageable, MangaSummaryResponse.class);
    }

    public void saveAdvancedSearchSummaryToCache(String searchHash, Pageable pageable, Page<MangaSummaryResponse> result) {
        savePageToCache(MANGA_ADVANCED_SEARCH_PREFIX, "summary:" + searchHash + ":page:" + pageable.getPageNumber() + ":size:" + pageable.getPageSize(), result);
    }

    // ==================== GENRE SEARCH CACHE ====================

    public Page<MangaSummaryResponse> getByGenreFromCache(String genreName, Pageable pageable) {
        return getPageFromCache(MANGA_BY_GENRE_PREFIX, genreName + ":page:" + pageable.getPageNumber() + ":size:" + pageable.getPageSize(), pageable, MangaSummaryResponse.class);
    }

    public void saveByGenreToCache(String genreName, Pageable pageable, Page<MangaSummaryResponse> result) {
        savePageToCache(MANGA_BY_GENRE_PREFIX, genreName + ":page:" + pageable.getPageNumber() + ":size:" + pageable.getPageSize(), result);
    }

    // ==================== MANGA SUMMARIES CACHE ====================

    public Page<MangaSummaryResponse> getMangaSummariesFromCache(Pageable pageable, String sort) {
        String sortKey = sort != null ? sort.replace(",", "_") : "default";
        return getPageFromCache(MANGA_SUMMARIES_PREFIX, sortKey + ":page:" + pageable.getPageNumber() + ":size:" + pageable.getPageSize(), pageable, MangaSummaryResponse.class);
    }

    public void saveMangaSummariesToCache(Pageable pageable, String sort, Page<MangaSummaryResponse> result) {
        String sortKey = sort != null ? sort.replace(",", "_") : "default";
        savePageToCache(MANGA_SUMMARIES_PREFIX, sortKey + ":page:" + pageable.getPageNumber() + ":size:" + pageable.getPageSize(), result);
    }

    // ==================== LATEST UPDATES CACHE (Existing) ====================

    public Page<MangaSummaryResponse> getLatestUpdatesFromCache(Pageable pageable) {
        return getPageFromCache(LATEST_UPDATES_PREFIX, "page:" + pageable.getPageNumber() + ":size:" + pageable.getPageSize(), pageable, MangaSummaryResponse.class);
    }

    public void saveLatestUpdatesToCache(Pageable pageable, Page<MangaSummaryResponse> result) {
        savePageToCache(LATEST_UPDATES_PREFIX, "page:" + pageable.getPageNumber() + ":size:" + pageable.getPageSize(), result);
    }

    // ==================== GENERIC HELPER METHODS ====================

    @SuppressWarnings("unchecked")
    private <T> Page<T> getPageFromCache(String prefix, String key, Pageable pageable, Class<T> clazz) {
        try {
            String contentKey = prefix + key + CONTENT_SUFFIX;
            String totalPagesKey = prefix + key + TOTAL_PAGES_SUFFIX;
            String totalElementsKey = prefix + key + TOTAL_ELEMENTS_SUFFIX;

            Object contentObj = redisTemplate.opsForValue().get(contentKey);
            Object totalPagesObj = redisTemplate.opsForValue().get(totalPagesKey);
            Object totalElementsObj = redisTemplate.opsForValue().get(totalElementsKey);

            if (contentObj == null || totalPagesObj == null || totalElementsObj == null) {
                return null;
            }

            String contentJson = contentObj.toString();
            List<T> content = objectMapper.readValue(contentJson,
                objectMapper.getTypeFactory().constructCollectionType(List.class, clazz));

            int totalPages = Integer.parseInt(totalPagesObj.toString());
            long totalElements = Long.parseLong(totalElementsObj.toString());

            return new PageImpl<>(content, pageable, totalElements);
        } catch (Exception e) {
            log.warn("Cache get error for {}: {}", prefix + key, e.getMessage());
            return null;
        }
    }

    private <T> void savePageToCache(String prefix, String key, Page<T> pageData) {
        try {
            String contentKey = prefix + key + CONTENT_SUFFIX;
            String totalPagesKey = prefix + key + TOTAL_PAGES_SUFFIX;
            String totalElementsKey = prefix + key + TOTAL_ELEMENTS_SUFFIX;

            String contentJson = objectMapper.writeValueAsString(pageData.getContent());

            redisTemplate.opsForValue().set(contentKey, contentJson, CACHE_TTL_SECONDS, TimeUnit.SECONDS);
            redisTemplate.opsForValue().set(totalPagesKey, String.valueOf(pageData.getTotalPages()), CACHE_TTL_SECONDS, TimeUnit.SECONDS);
            redisTemplate.opsForValue().set(totalElementsKey, String.valueOf(pageData.getTotalElements()), CACHE_TTL_SECONDS, TimeUnit.SECONDS);

        } catch (JsonProcessingException e) {
            log.warn("Cache save error for {}: {}", prefix + key, e.getMessage());
        }
    }

    // ==================== RECOMMENDATIONS CACHE ====================

    public List<MangaSummaryResponse> getRecommendationsFromCache(String userId, int limit) {
        try {
            String key = RECOMMENDATIONS_PREFIX + "user:" + userId + ":limit:" + limit;
            Object cachedData = redisTemplate.opsForValue().get(key);

            if (cachedData == null) {
                return null;
            }

            // Deserialize List<MangaSummaryResponse>
            return objectMapper.readValue(cachedData.toString(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, MangaSummaryResponse.class));
        } catch (Exception e) {
            log.warn("Cache get error for recommendations userId {}, limit {}: {}", userId, limit, e.getMessage());
            return null;
        }
    }

    public void saveRecommendationsToCache(String userId, int limit, List<MangaSummaryResponse> recommendations) {
        try {
            String key = RECOMMENDATIONS_PREFIX + "user:" + userId + ":limit:" + limit;
            String recommendationsJson = objectMapper.writeValueAsString(recommendations);
            redisTemplate.opsForValue().set(key, recommendationsJson, CACHE_TTL_SECONDS, TimeUnit.SECONDS);
            log.debug("Saved recommendations to cache for userId: {}, limit: {}", userId, limit);
        } catch (JsonProcessingException e) {
            log.warn("Cache save error for recommendations userId {}, limit {}: {}", userId, limit, e.getMessage());
        }
    }
}
