package com.raindrop.profile_service.repository;

import com.raindrop.profile_service.entity.ReadingHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingHistoryRepository extends JpaRepository<ReadingHistory, String> {
    /**
     * Tìm lịch sử đọc của một người dùng, sắp xếp theo thời gian đọc giảm dần
     */
    List<ReadingHistory> findByUserIdOrderByReadAtDesc(String userId);
    
    /**
     * Tìm lịch sử đọc của một người dùng với phân trang
     */
    Page<ReadingHistory> findByUserId(String userId, Pageable pageable);
    
    /**
     * Tìm lịch sử đọc cụ thể của một người dùng cho một manga và chapter
     */
    Optional<ReadingHistory> findByUserIdAndMangaIdAndChapterId(String userId, String mangaId, String chapterId);
    
    /**
     * Tìm tất cả lịch sử đọc của một người dùng cho một manga cụ thể
     */
    List<ReadingHistory> findByUserIdAndMangaIdOrderByReadAtDesc(String userId, String mangaId);
    
    /**
     * Xóa một mục trong lịch sử đọc của người dùng
     */
    @Modifying
    @Query("DELETE FROM ReadingHistory rh WHERE rh.userId = ?1 AND rh.id = ?2")
    void deleteByUserIdAndId(String userId, String id);
    
    /**
     * Xóa tất cả lịch sử đọc của một người dùng
     */
    @Modifying
    @Query("DELETE FROM ReadingHistory rh WHERE rh.userId = ?1")
    void deleteAllByUserId(String userId);
}
