package com.raindrop.manga_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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
public class MangaSummariesRedisService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final long CACHE_TTL_SECONDS = 300;
    private static final String LATEST_UPDATES_PREFIX = "latest_updates:";
    private static final String PAGE_PREFIX = "page:";
    private static final String SIZE_PREFIX = "size:";
    private static final String CONTENT_SUFFIX = ":content";
    private static final String TOTAL_PAGES_SUFFIX = ":total_pages";
    private static final String TOTAL_ELEMENTS_SUFFIX = ":total_elements";

    private String getContentCacheKey(int page, int size) {
        return LATEST_UPDATES_PREFIX + PAGE_PREFIX + page + ":" + SIZE_PREFIX + size + CONTENT_SUFFIX;
    }

    private String getTotalPagesCacheKey(int size) {
        return LATEST_UPDATES_PREFIX + SIZE_PREFIX + size + TOTAL_PAGES_SUFFIX;
    }

    private String getTotalElementsCacheKey(int size) {
        return LATEST_UPDATES_PREFIX + SIZE_PREFIX + size + TOTAL_ELEMENTS_SUFFIX;
    }

    public Page<MangaSummaryResponse> getFromCache(Pageable pageable) {
        try {
            int page = pageable.getPageNumber();
            int size = pageable.getPageSize();

            String contentKey = getContentCacheKey(page, size);
            String totalPagesKey = getTotalPagesCacheKey(size);
            String totalElementsKey = getTotalElementsCacheKey(size);

            Object contentObj = redisTemplate.opsForValue().get(contentKey);
            Object totalPagesObj = redisTemplate.opsForValue().get(totalPagesKey);
            Object totalElementsObj = redisTemplate.opsForValue().get(totalElementsKey);

            if (contentObj == null || totalPagesObj == null || totalElementsObj == null) {
                return null;
            }

            String contentJson = contentObj.toString();
            List<MangaSummaryResponse> content = objectMapper.readValue(contentJson,
                objectMapper.getTypeFactory().constructCollectionType(List.class, MangaSummaryResponse.class));

            content = content.stream().map(item -> {
                try {
                    if (item.getLastChapterAddedAt() != null) {
                        item.getLastChapterAddedAt().toString();
                    }
                } catch (Exception e) {
                    item.setLastChapterAddedAt(null);
                    item.setCreatedAt(null);
                    item.setUpdatedAt(null);
                }
                return item;
            }).collect(java.util.stream.Collectors.toList());

            int totalPages = Integer.parseInt(totalPagesObj.toString());
            long totalElements = Long.parseLong(totalElementsObj.toString());

            return new PageImpl<>(content, pageable, totalElements);

        } catch (Exception e) {
            log.error("Cache error: {}", e.getMessage());
            return null;
        }
    }

    public void saveToCache(Pageable pageable, Page<MangaSummaryResponse> pageData) {
        try {
            int page = pageable.getPageNumber();
            int size = pageable.getPageSize();

            String contentKey = getContentCacheKey(page, size);
            String totalPagesKey = getTotalPagesCacheKey(size);
            String totalElementsKey = getTotalElementsCacheKey(size);

            String contentJson = objectMapper.writeValueAsString(pageData.getContent());

            redisTemplate.opsForValue().set(contentKey, contentJson, CACHE_TTL_SECONDS, TimeUnit.SECONDS);
            redisTemplate.opsForValue().set(totalPagesKey, String.valueOf(pageData.getTotalPages()), CACHE_TTL_SECONDS, TimeUnit.SECONDS);
            redisTemplate.opsForValue().set(totalElementsKey, String.valueOf(pageData.getTotalElements()), CACHE_TTL_SECONDS, TimeUnit.SECONDS);

        } catch (JsonProcessingException e) {
            log.error("Cache save error: {}", e.getMessage());
        }
    }

    public boolean hasCache(Pageable pageable) {
        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        String contentKey = getContentCacheKey(page, size);
        return redisTemplate.hasKey(contentKey);
    }
}
