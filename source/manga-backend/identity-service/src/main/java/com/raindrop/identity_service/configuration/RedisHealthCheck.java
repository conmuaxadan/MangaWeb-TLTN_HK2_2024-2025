package com.raindrop.identity_service.configuration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Kiểm tra kết nối Redis khi ứng dụng khởi động
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RedisHealthCheck implements CommandLineRunner {

    private final RedisConnectionFactory redisConnectionFactory;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void run(String... args) {
        try {
            log.info("Checking Redis connection...");
            redisConnectionFactory.getConnection().ping();
            
            // Thử lưu và lấy một giá trị từ Redis
            String testKey = "test:health:check";
            redisTemplate.opsForValue().set(testKey, "OK");
            Object value = redisTemplate.opsForValue().get(testKey);
            redisTemplate.delete(testKey);
            
            log.info("Redis connection is healthy. Test value: {}", value);
        } catch (Exception e) {
            log.error("Redis connection failed: {}", e.getMessage(), e);
            log.warn("Application will continue to run, but Redis features may not work properly");
        }
    }
}
