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

    /**
     * Đếm tổng số lượt xem của người dùng đã đăng nhập (mỗi bản ghi là 1 lượt xem chapter)
     * @return Tổng số lượt xem
     */
    @Query("SELECT COUNT(rh) FROM ReadingHistory rh")
    Long countTotalViews();

    /**
     * Đếm số lượt xem trong ngày hôm nay của người dùng đã đăng nhập
     * @return Số lượt xem trong ngày
     */
    @Query("SELECT COUNT(rh) FROM ReadingHistory rh WHERE DATE(rh.createdAt) = CURRENT_DATE")
    Long countTodayViews();

    /**
     * Đếm số lượng người dùng duy nhất đã đọc truyện
     * @return Số lượng người dùng duy nhất
     */
    @Query("SELECT COUNT(DISTINCT rh.userId) FROM ReadingHistory rh")
    Long countDistinctUsers();
}
