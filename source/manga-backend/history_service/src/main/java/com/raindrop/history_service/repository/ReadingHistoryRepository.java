package com.raindrop.history_service.repository;

import com.raindrop.history_service.entity.ReadingHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReadingHistoryRepository extends JpaRepository<ReadingHistory, String> {
    Page<ReadingHistory> findByUserId(String userId, Pageable pageable);

    @Query("SELECT rh FROM ReadingHistory rh WHERE rh.userId = :userId GROUP BY rh.mangaId ORDER BY MAX(rh.updatedAt) DESC")
    Page<ReadingHistory> findLatestByUserIdGroupByManga(@Param("userId") String userId, Pageable pageable);

    Optional<ReadingHistory> findByUserIdAndMangaIdAndChapterId(String userId, String mangaId, String chapterId);

    Optional<ReadingHistory> findFirstByUserIdAndMangaIdOrderByUpdatedAtDesc(String userId, String mangaId);

    List<ReadingHistory> findByMangaId(String mangaId);

    List<ReadingHistory> findByUserIdOrderByUpdatedAtDesc(String userId);

    /**
     * Lấy tất cả mangaId đã đọc của người dùng
     * @param userId ID của người dùng
     * @return Danh sách tất cả mangaId đã đọc
     */
    @Query(value = "SELECT DISTINCT manga_id FROM reading_histories WHERE user_id = :userId", nativeQuery = true)
    List<String> findAllMangaIdsByUserId(@Param("userId") String userId);

    /**
     * Lấy danh sách mangaId gần đây của người dùng, mỗi manga chỉ lấy 1 lần
     * @param userId ID của người dùng
     * @param limit Số lượng mangaId cần lấy
     * @return Danh sách mangaId gần đây
     */
    @Query(value = "SELECT DISTINCT rh.manga_id FROM reading_histories rh " +
            "WHERE rh.user_id = :userId " +
            "ORDER BY MAX(rh.updated_at) DESC LIMIT :limit", nativeQuery = true)
    List<String> findRecentMangaIdsByUserId(@Param("userId") String userId, @Param("limit") int limit);
}
