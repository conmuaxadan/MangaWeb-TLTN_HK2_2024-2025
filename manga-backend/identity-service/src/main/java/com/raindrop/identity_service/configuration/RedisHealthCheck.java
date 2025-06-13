package com.raindrop.identity_service.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisHealthCheck implements CommandLineRunner {

    private final RedisConnectionFactory redisConnectionFactory;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void run(String... args) {
        try {
            redisConnectionFactory.getConnection().ping();

            // Thử lưu và lấy một giá trị từ Redis
            String testKey = "test:health:check";
            redisTemplate.opsForValue().set(testKey, "OK");
            Object value = redisTemplate.opsForValue().get(testKey);
            redisTemplate.delete(testKey);
        } catch (Exception e) {
            // Silent error handling
        }
    }
}
