package com.raindrop.history_service.repository;

import com.raindrop.history_service.entity.AnonymousReadingHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AnonymousReadingHistoryRepository extends JpaRepository<AnonymousReadingHistory, String> {
    Optional<AnonymousReadingHistory> findBySessionIdAndMangaIdAndChapterId(String sessionId, String mangaId, String chapterId);

    List<AnonymousReadingHistory> findBySessionIdOrderByUpdatedAtDesc(String sessionId);

    @Query("SELECT COUNT(DISTINCT a.sessionId) FROM AnonymousReadingHistory a")
    Long countDistinctSessions();

    @Query("SELECT COUNT(DISTINCT a.sessionId) FROM AnonymousReadingHistory a WHERE a.mangaId = :mangaId")
    Long countDistinctSessionsByMangaId(@Param("mangaId") String mangaId);

    @Query("SELECT COUNT(DISTINCT a.sessionId) FROM AnonymousReadingHistory a WHERE a.chapterId = :chapterId")
    Long countDistinctSessionsByChapterId(@Param("chapterId") String chapterId);

    @Query("SELECT a FROM AnonymousReadingHistory a WHERE a.sessionId = :sessionId GROUP BY a.mangaId ORDER BY MAX(a.updatedAt) DESC")
    Page<AnonymousReadingHistory> findLatestBySessionIdGroupByManga(@Param("sessionId") String sessionId, Pageable pageable);

    Optional<AnonymousReadingHistory> findFirstBySessionIdAndMangaIdOrderByUpdatedAtDesc(String sessionId, String mangaId);

    /**
     * Đếm tổng số lượt xem (mỗi bản ghi là 1 lượt xem chapter)
     * @return Tổng số lượt xem
     */
    @Query("SELECT COUNT(a) FROM AnonymousReadingHistory a")
    Long countTotalViews();

    /**
     * Đếm số lượt xem trong ngày hôm nay
     * @return Số lượt xem trong ngày
     */
    @Query("SELECT COUNT(a) FROM AnonymousReadingHistory a WHERE DATE(a.createdAt) = CURRENT_DATE")
    Long countTodayViews();
}
