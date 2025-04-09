package com.raindrop.identity_service.service;

import com.raindrop.identity_service.repository.InvalidatedTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;

/**
 * Service để quản lý việc dọn dẹp các token đã hết hạn
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = lombok.AccessLevel.PRIVATE)
public class TokenCleanupService {

    InvalidatedTokenRepository invalidatedTokenRepository;

    /**
     * Dọn dẹp các token đã hết hạn mỗi giờ
     * Sử dụng cron expression: "0 0 * * * *" (chạy vào phút 0 của mỗi giờ)
     */
    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        log.info("Starting scheduled cleanup of expired tokens");
        Date now = new Date();
        
        try {
            int count = invalidatedTokenRepository.findByExpiryTimeBefore(now).size();
            invalidatedTokenRepository.deleteAllExpiredBefore(now);
            log.info("Successfully cleaned up {} expired tokens", count);
        } catch (Exception e) {
            log.error("Error during token cleanup", e);
        }
    }
}
