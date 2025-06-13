package com.raindrop.history_service.repository;

import com.raindrop.history_service.entity.AnonymousHistory;
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

    @Query("SELECT COUNT(a) FROM AnonymousHistory a")
    Long countTotalViews();

    @Query("SELECT COUNT(a) FROM AnonymousHistory a WHERE DATE(a.createdAt) = CURRENT_DATE")
    Long countTodayViews();

    @Query("SELECT (DATE(a.createdAt), COUNT(a)) " +
            "FROM AnonymousHistory a " +
            "WHERE DATE(a.createdAt) BETWEEN :startDate AND :endDate " +
            "GROUP BY DATE(a.createdAt) ORDER BY DATE(a.createdAt)")
    List<Object[]> countViewsByDayBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(a) FROM AnonymousHistory a WHERE YEARWEEK(a.createdAt) = YEARWEEK(CURRENT_DATE)")
    Long countThisWeekViews();

    @Query("SELECT COUNT(a) FROM AnonymousHistory a WHERE YEAR(a.createdAt) = YEAR(CURRENT_DATE) AND MONTH(a.createdAt) = MONTH(CURRENT_DATE)")
    Long countThisMonthViews();

    @Query("SELECT (a.mangaId, COUNT(a)) " +
            "FROM AnonymousHistory a GROUP BY a.mangaId ORDER BY COUNT(a) DESC")
    List<Object[]> countViewsByManga();

    @Query("SELECT (a.mangaId, COUNT(a)) " +
            "FROM AnonymousHistory a WHERE a.mangaId IN :mangaIds GROUP BY a.mangaId")
    List<Object[]> countViewsByMangaIds(@Param("mangaIds") List<String> mangaIds);

    @Query("SELECT (a.mangaId, COUNT(a)) " +
            "FROM AnonymousHistory a " +
            "WHERE DATE(a.createdAt) BETWEEN :startDate AND :endDate " +
            "GROUP BY a.mangaId ORDER BY COUNT(a) DESC")
    List<Object[]> countViewsByMangaBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
