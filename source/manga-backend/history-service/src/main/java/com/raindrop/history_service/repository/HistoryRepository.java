package com.raindrop.history_service.repository;

import com.raindrop.history_service.entity.History;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Transactional
public interface HistoryRepository extends JpaRepository<History, String> {
    Page<History> findByUserId(String userId, Pageable pageable);

    @Query("SELECT rh FROM History rh WHERE rh.userId = :userId GROUP BY rh.mangaId ORDER BY MAX(rh.updatedAt) DESC")
    Page<History> findLatestByUserIdGroupByManga(@Param("userId") String userId, Pageable pageable);

    Optional<History> findByUserIdAndMangaIdAndChapterId(String userId, String mangaId, String chapterId);

    Optional<History> findFirstByUserIdAndMangaIdOrderByUpdatedAtDesc(String userId, String mangaId);

    List<History> findByMangaId(String mangaId);

    List<History> findByUserIdOrderByUpdatedAtDesc(String userId);

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
    @Query("SELECT COUNT(rh) FROM History rh")
    Long countTotalViews();

    /**
     * Đếm số lượt xem trong ngày hôm nay của người dùng đã đăng nhập
     * @return Số lượt xem trong ngày
     */
    @Query("SELECT COUNT(rh) FROM History rh WHERE DATE(rh.createdAt) = CURRENT_DATE")
    Long countTodayViews();

    /**
     * Đếm số lượng người dùng duy nhất đã đọc truyện
     * @return Số lượng người dùng duy nhất
     */
    @Query("SELECT COUNT(DISTINCT rh.userId) FROM History rh")
    Long countDistinctUsers();

    /**
     * Đếm số lượt xem theo ngày trong khoảng thời gian
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @return Danh sách thống kê lượt xem theo ngày
     */
    @Query("SELECT (DATE(rh.createdAt), COUNT(rh)) " +
            "FROM History rh " +
            "WHERE DATE(rh.createdAt) BETWEEN :startDate AND :endDate " +
            "GROUP BY DATE(rh.createdAt) ORDER BY DATE(rh.createdAt)")
    List<Object[]> countViewsByDayBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * Đếm số lượt xem trong tuần này
     * @return Số lượt xem trong tuần
     */
    @Query("SELECT COUNT(rh) FROM History rh WHERE YEARWEEK(rh.createdAt) = YEARWEEK(CURRENT_DATE)")
    Long countThisWeekViews();

    /**
     * Đếm số lượt xem trong tháng này
     * @return Số lượt xem trong tháng
     */
    @Query("SELECT COUNT(rh) FROM History rh WHERE YEAR(rh.createdAt) = YEAR(CURRENT_DATE) AND MONTH(rh.createdAt) = MONTH(CURRENT_DATE)")
    Long countThisMonthViews();

    /**
     * Đếm số lượt xem theo truyện
     * @return Danh sách số lượt xem theo truyện
     */
    @Query("SELECT (rh.mangaId, COUNT(rh)) " +
            "FROM History rh GROUP BY rh.mangaId ORDER BY COUNT(rh) DESC")
    List<Object[]> countViewsByManga();

    /**
     * Đếm số lượt xem theo truyện của người dùng đã đăng nhập
     * @param mangaIds Danh sách ID của truyện
     * @return Số lượt xem của mỗi truyện
     */
    @Query("SELECT (rh.mangaId, COUNT(rh)) " +
            "FROM History rh WHERE rh.mangaId IN :mangaIds GROUP BY rh.mangaId")
    List<Object[]> countViewsByMangaIds(@Param("mangaIds") List<String> mangaIds);

    /**
     * Đếm số lượt xem theo truyện trong khoảng thời gian
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @return Danh sách số lượt xem theo truyện
     */
    @Query("SELECT (rh.mangaId, COUNT(rh)) " +
            "FROM History rh " +
            "WHERE DATE(rh.createdAt) BETWEEN :startDate AND :endDate " +
            "GROUP BY rh.mangaId ORDER BY COUNT(rh) DESC")
    List<Object[]> countViewsByMangaBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
