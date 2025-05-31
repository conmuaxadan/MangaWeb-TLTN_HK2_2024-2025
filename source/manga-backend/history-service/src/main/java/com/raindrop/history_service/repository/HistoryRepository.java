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

    @Query(value = "SELECT DISTINCT manga_id FROM histories WHERE user_id = :userId", nativeQuery = true)
    List<String> findAllMangaIdsByUserId(@Param("userId") String userId);

    @Query("SELECT COUNT(rh) FROM History rh")
    Long countTotalViews();

    @Query("SELECT COUNT(rh) FROM History rh WHERE DATE(rh.createdAt) = CURRENT_DATE")
    Long countTodayViews();

    @Query("SELECT COUNT(DISTINCT rh.userId) FROM History rh")
    Long countDistinctUsers();

    @Query("SELECT (DATE(rh.createdAt), COUNT(rh)) " +
            "FROM History rh " +
            "WHERE DATE(rh.createdAt) BETWEEN :startDate AND :endDate " +
            "GROUP BY DATE(rh.createdAt) ORDER BY DATE(rh.createdAt)")
    List<Object[]> countViewsByDayBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(rh) FROM History rh WHERE YEARWEEK(rh.createdAt) = YEARWEEK(CURRENT_DATE)")
    Long countThisWeekViews();

    @Query("SELECT COUNT(rh) FROM History rh WHERE YEAR(rh.createdAt) = YEAR(CURRENT_DATE) AND MONTH(rh.createdAt) = MONTH(CURRENT_DATE)")
    Long countThisMonthViews();

    @Query("SELECT (rh.mangaId, COUNT(rh)) " +
            "FROM History rh GROUP BY rh.mangaId ORDER BY COUNT(rh) DESC")
    List<Object[]> countViewsByManga();

    @Query("SELECT (rh.mangaId, COUNT(rh)) " +
            "FROM History rh WHERE rh.mangaId IN :mangaIds GROUP BY rh.mangaId")
    List<Object[]> countViewsByMangaIds(@Param("mangaIds") List<String> mangaIds);

    @Query("SELECT (rh.mangaId, COUNT(rh)) " +
            "FROM History rh " +
            "WHERE DATE(rh.createdAt) BETWEEN :startDate AND :endDate " +
            "GROUP BY rh.mangaId ORDER BY COUNT(rh) DESC")
    List<Object[]> countViewsByMangaBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
