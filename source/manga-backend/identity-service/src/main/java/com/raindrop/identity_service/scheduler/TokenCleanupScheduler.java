package com.raindrop.identity_service.scheduler;

import com.raindrop.identity_service.repository.InvalidatedTokenRepository;
import com.raindrop.identity_service.repository.RefreshTokenRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
@RequiredArgsConstructor
@Slf4j
public class TokenCleanupScheduler {

    private final InvalidatedTokenRepository invalidatedTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Chạy mỗi 5 phút để dọn dẹp các token đã hết hạn
     * Dọn dẹp cả invalidated tokens và refresh tokens
     */
    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        log.info("Starting scheduled cleanup of expired tokens");
        Date now = new Date();

        try {
            // Dọn dẹp invalidated tokens
            int invalidatedCount = invalidatedTokenRepository.findByExpiryTimeBefore(now).size();
            invalidatedTokenRepository.deleteAllExpiredBefore(now);
            log.info("Successfully cleaned up {} expired invalidated tokens", invalidatedCount);

            // Dọn dẹp refresh tokens
            refreshTokenRepository.deleteAllExpiredAndRevokedTokens();
            log.info("Successfully cleaned up expired and revoked refresh tokens");
        } catch (Exception e) {
            log.error("Error during token cleanup", e);
        }
    }

    /**
     * Chạy mỗi ngày lúc 2 giờ sáng để dọn dẹp toàn bộ token hết hạn
     * Đây là một biện pháp dự phòng để đảm bảo không có token nào bị sót
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void deepCleanupExpiredTokens() {
        log.info("Starting deep cleanup of all expired tokens");
        Date now = new Date();

        try {
            // Dọn dẹp triệt để invalidated tokens
            int invalidatedCount = invalidatedTokenRepository.findByExpiryTimeBefore(now).size();
            invalidatedTokenRepository.deleteAllExpiredBefore(now);
            log.info("Deep cleanup: removed {} expired invalidated tokens", invalidatedCount);

            // Dọn dẹp triệt để refresh tokens
            refreshTokenRepository.deleteAllExpiredAndRevokedTokens();
            log.info("Deep cleanup: removed all expired and revoked refresh tokens");

            log.info("Deep cleanup of all expired tokens completed successfully");
        } catch (Exception e) {
            log.error("Error during deep token cleanup", e);
        }
    }
}
