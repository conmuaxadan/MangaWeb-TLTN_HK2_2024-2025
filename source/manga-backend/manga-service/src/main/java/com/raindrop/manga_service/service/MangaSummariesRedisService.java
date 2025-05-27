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

/**
 * Service để quản lý cache cho Latest Updates manga
 * Sử dụng Redis để cache kết quả getMangaSummariesPaginated với sort=lastChapterAddedAt,desc
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MangaSummariesRedisService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    // TTL cho cache: 5 phút
    private static final long CACHE_TTL_SECONDS = 300;

    // Prefix cho cache keys
    private static final String LATEST_UPDATES_PREFIX = "latest_updates:";
    private static final String PAGE_PREFIX = "page:";
    private static final String SIZE_PREFIX = "size:";
    private static final String CONTENT_SUFFIX = ":content";
    private static final String TOTAL_PAGES_SUFFIX = ":total_pages";
    private static final String TOTAL_ELEMENTS_SUFFIX = ":total_elements";

    /**
     * Tạo cache key cho content
     * @param page Số trang
     * @param size Kích thước trang
     * @return Cache key
     */
    private String getContentCacheKey(int page, int size) {
        return LATEST_UPDATES_PREFIX + PAGE_PREFIX + page + ":" + SIZE_PREFIX + size + CONTENT_SUFFIX;
    }

    /**
     * Tạo cache key cho total pages
     * @param size Kích thước trang
     * @return Cache key
     */
    private String getTotalPagesCacheKey(int size) {
        return LATEST_UPDATES_PREFIX + SIZE_PREFIX + size + TOTAL_PAGES_SUFFIX;
    }

    /**
     * Tạo cache key cho total elements
     * @param size Kích thước trang
     * @return Cache key
     */
    private String getTotalElementsCacheKey(int size) {
        return LATEST_UPDATES_PREFIX + SIZE_PREFIX + size + TOTAL_ELEMENTS_SUFFIX;
    }

    /**
     * Lấy dữ liệu từ cache
     * @param pageable Thông tin phân trang
     * @return Page data từ cache hoặc null nếu không có
     */
    public Page<MangaSummaryResponse> getFromCache(Pageable pageable) {
        try {
            int page = pageable.getPageNumber();
            int size = pageable.getPageSize();

            String contentKey = getContentCacheKey(page, size);
            String totalPagesKey = getTotalPagesCacheKey(size);
            String totalElementsKey = getTotalElementsCacheKey(size);

            // Lấy content từ cache
            Object contentObj = redisTemplate.opsForValue().get(contentKey);
            Object totalPagesObj = redisTemplate.opsForValue().get(totalPagesKey);
            Object totalElementsObj = redisTemplate.opsForValue().get(totalElementsKey);

            if (contentObj == null || totalPagesObj == null || totalElementsObj == null) {
                log.debug("Cache miss for latest updates: page={}, size={}", page, size);
                return null;
            }

            // Deserialize content
            String contentJson = contentObj.toString();
            log.debug("Deserializing JSON sample: {}", contentJson.substring(0, Math.min(200, contentJson.length())));

            List<MangaSummaryResponse> content = objectMapper.readValue(contentJson,
                objectMapper.getTypeFactory().constructCollectionType(List.class, MangaSummaryResponse.class));

            // Validate và clean up dates nếu cần
            content = content.stream().map(item -> {
                // Nếu có date không hợp lệ, set về null để frontend handle
                try {
                    if (item.getLastChapterAddedAt() != null) {
                        // Test xem date có valid không
                        item.getLastChapterAddedAt().toString();
                    }
                } catch (Exception e) {
                    log.warn("Invalid date in cached item {}, setting dates to null", item.getId());
                    item.setLastChapterAddedAt(null);
                    item.setCreatedAt(null);
                    item.setUpdatedAt(null);
                }
                return item;
            }).collect(java.util.stream.Collectors.toList());

            // Debug: Log first deserialized item
            if (!content.isEmpty()) {
                MangaSummaryResponse sample = content.get(0);
                log.debug("Sample deserialized item: {}", sample);
                log.debug("Sample lastChapterAddedAt: {}", sample.getLastChapterAddedAt());
            }

            int totalPages = Integer.parseInt(totalPagesObj.toString());
            long totalElements = Long.parseLong(totalElementsObj.toString());

            log.info("Cache hit for latest updates: page={}, size={}, totalElements={}", page, size, totalElements);
            return new PageImpl<>(content, pageable, totalElements);

        } catch (Exception e) {
            log.error("Error getting latest updates from cache: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Lưu dữ liệu vào cache
     * @param pageable Thông tin phân trang
     * @param pageData Dữ liệu page cần cache
     */
    public void saveToCache(Pageable pageable, Page<MangaSummaryResponse> pageData) {
        try {
            int page = pageable.getPageNumber();
            int size = pageable.getPageSize();

            String contentKey = getContentCacheKey(page, size);
            String totalPagesKey = getTotalPagesCacheKey(size);
            String totalElementsKey = getTotalElementsCacheKey(size);

            // Serialize content
            String contentJson = objectMapper.writeValueAsString(pageData.getContent());

            // Debug: Log first item to check serialization
            if (!pageData.getContent().isEmpty()) {
                log.debug("Sample cached item: {}", pageData.getContent().get(0));
                log.debug("Serialized JSON sample: {}", contentJson.substring(0, Math.min(200, contentJson.length())));
            }

            // Lưu vào cache với TTL
            redisTemplate.opsForValue().set(contentKey, contentJson, CACHE_TTL_SECONDS, TimeUnit.SECONDS);
            redisTemplate.opsForValue().set(totalPagesKey, String.valueOf(pageData.getTotalPages()), CACHE_TTL_SECONDS, TimeUnit.SECONDS);
            redisTemplate.opsForValue().set(totalElementsKey, String.valueOf(pageData.getTotalElements()), CACHE_TTL_SECONDS, TimeUnit.SECONDS);

            log.info("Cached latest updates: page={}, size={}, totalElements={}, TTL={}s",
                page, size, pageData.getTotalElements(), CACHE_TTL_SECONDS);

        } catch (JsonProcessingException e) {
            log.error("Error saving latest updates to cache: {}", e.getMessage(), e);
        }
    }

    /**
     * Kiểm tra xem có cache cho trang cụ thể không
     * @param pageable Thông tin phân trang
     * @return true nếu có cache, false nếu không
     */
    public boolean hasCache(Pageable pageable) {
        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        String contentKey = getContentCacheKey(page, size);
        return redisTemplate.hasKey(contentKey);
    }
}
