package com.raindrop.identity_service.repository;

import com.raindrop.identity_service.entity.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Date;
import java.util.List;

public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String> {

    /**
     * Tìm tất cả các token đã hết hạn trước một thời điểm cụ thể
     * @param date Thời điểm so sánh
     * @return Danh sách các token đã hết hạn
     */
    List<InvalidatedToken> findByExpiryTimeBefore(Date date);

    /**
     * Xóa tất cả các token đã hết hạn trước một thời điểm cụ thể
     * @param date Thời điểm so sánh
     */
    @Query("DELETE FROM InvalidatedToken t WHERE t.expiryTime < ?1")
    void deleteAllExpiredBefore(Date date);
}
