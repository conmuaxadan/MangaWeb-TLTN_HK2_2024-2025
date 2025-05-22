package com.raindrop.history_service.repository;

import com.raindrop.history_service.entity.AnonymousHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AnonymousHistoryRepository extends JpaRepository<AnonymousHistory, String> {
    Optional<AnonymousHistory> findBySessionIdAndMangaIdAndChapterId(String sessionId, String mangaId, String chapterId);

    List<AnonymousHistory> findBySessionIdOrderByUpdatedAtDesc(String sessionId);

    @Query("SELECT COUNT(DISTINCT a.sessionId) FROM AnonymousHistory a")
    Long countDistinctSessions();

    @Query("SELECT COUNT(DISTINCT a.sessionId) FROM AnonymousHistory a WHERE a.mangaId = :mangaId")
    Long countDistinctSessionsByMangaId(@Param("mangaId") String mangaId);

    @Query("SELECT COUNT(DISTINCT a.sessionId) FROM AnonymousHistory a WHERE a.chapterId = :chapterId")
    Long countDistinctSessionsByChapterId(@Param("chapterId") String chapterId);

    @Query("SELECT a FROM AnonymousHistory a WHERE a.sessionId = :sessionId GROUP BY a.mangaId ORDER BY MAX(a.updatedAt) DESC")
    Page<AnonymousHistory> findLatestBySessionIdGroupByManga(@Param("sessionId") String sessionId, Pageable pageable);

    Optional<AnonymousHistory> findFirstBySessionIdAndMangaIdOrderByUpdatedAtDesc(String sessionId, String mangaId);

    /**
     * Đếm tổng số lượt xem (mỗi bản ghi là 1 lượt xem chapter)
     * @return Tổng số lượt xem
     */
    @Query("SELECT COUNT(a) FROM AnonymousHistory a")
    Long countTotalViews();

    /**
     * Đếm số lượt xem trong ngày hôm nay
     * @return Số lượt xem trong ngày
     */
    @Query("SELECT COUNT(a) FROM AnonymousHistory a WHERE DATE(a.createdAt) = CURRENT_DATE")
    Long countTodayViews();

    /**
     * Đếm số lượt xem theo ngày trong khoảng thời gian
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @return Map với key là ngày và value là số lượt xem
     */
    @Query("SELECT DATE(a.createdAt) as date, COUNT(a) as views FROM AnonymousHistory a " +
            "WHERE DATE(a.createdAt) BETWEEN :startDate AND :endDate " +
            "GROUP BY DATE(a.createdAt) ORDER BY DATE(a.createdAt)")
    List<Object[]> countViewsByDayBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * Đếm số lượt xem trong tuần này
     * @return Số lượt xem trong tuần
     */
    @Query("SELECT COUNT(a) FROM AnonymousHistory a WHERE YEARWEEK(a.createdAt) = YEARWEEK(CURRENT_DATE)")
    Long countThisWeekViews();

    /**
     * Đếm số lượt xem trong tháng này
     * @return Số lượt xem trong tháng
     */
    @Query("SELECT COUNT(a) FROM AnonymousHistory a WHERE YEAR(a.createdAt) = YEAR(CURRENT_DATE) AND MONTH(a.createdAt) = MONTH(CURRENT_DATE)")
    Long countThisMonthViews();

    /**
     * Đếm số lượt xem theo truyện của người dùng không đăng nhập
     * @return Danh sách số lượt xem theo truyện
     */
    @Query("SELECT a.mangaId, COUNT(a) as views FROM AnonymousHistory a GROUP BY a.mangaId ORDER BY views DESC")
    List<Object[]> countViewsByManga();

    /**
     * Đếm số lượt xem theo truyện của người dùng không đăng nhập
     * @param mangaIds Danh sách ID của truyện
     * @return Số lượt xem của mỗi truyện
     */
    @Query("SELECT a.mangaId, COUNT(a) as views FROM AnonymousHistory a WHERE a.mangaId IN :mangaIds GROUP BY a.mangaId")
    List<Object[]> countViewsByMangaIds(@Param("mangaIds") List<String> mangaIds);

    /**
     * Đếm số lượt xem theo truyện trong khoảng thời gian
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @return Danh sách số lượt xem theo truyện
     */
    @Query("SELECT a.mangaId, COUNT(a) as views FROM AnonymousHistory a " +
            "WHERE DATE(a.createdAt) BETWEEN :startDate AND :endDate " +
            "GROUP BY a.mangaId ORDER BY views DESC")
    List<Object[]> countViewsByMangaBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
