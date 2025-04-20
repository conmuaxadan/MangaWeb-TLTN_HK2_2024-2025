package com.raindrop.manga_service.repository;

import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.entity.ViewLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface ViewLogRepository extends JpaRepository<ViewLog, String> {

    /**
     * Kiểm tra xem một session đã xem chapter trong khoảng thời gian nhất định chưa
     * @param chapter Chapter được xem
     * @param sessionId ID của session
     * @param since Thời điểm bắt đầu kiểm tra
     * @return true nếu đã xem, false nếu chưa
     */
    boolean existsByChapterAndSessionIdAndCreatedAtAfter(Chapter chapter, String sessionId, LocalDateTime since);

    /**
     * Kiểm tra xem một user đã xem chapter trong khoảng thời gian nhất định chưa
     * @param chapter Chapter được xem
     * @param userId ID của user
     * @param since Thời điểm bắt đầu kiểm tra
     * @return true nếu đã xem, false nếu chưa
     */
    boolean existsByChapterAndUserIdAndCreatedAtAfter(Chapter chapter, String userId, LocalDateTime since);

    /**
     * Đếm số lượt xem của một chapter
     * @param chapter Chapter được xem
     * @return Số lượt xem
     */
    long countByChapter(Chapter chapter);

    /**
     * Đếm số lượt xem của một manga
     * @param mangaId ID của manga
     * @return Số lượt xem
     */
    @Query("SELECT COUNT(v) FROM ViewLog v WHERE v.chapter.manga.id = :mangaId")
    long countByMangaId(@Param("mangaId") String mangaId);

    /**
     * Đếm số lượt xem của một chapter bởi user đã đăng nhập
     * @param chapter Chapter được xem
     * @param isAuthenticated Trạng thái đăng nhập
     * @return Số lượt xem
     */
    long countByChapterAndIsAuthenticated(Chapter chapter, boolean isAuthenticated);

    /**
     * Đếm số lượt xem của một manga bởi user đã đăng nhập
     * @param mangaId ID của manga
     * @param isAuthenticated Trạng thái đăng nhập
     * @return Số lượt xem
     */
    @Query("SELECT COUNT(v) FROM ViewLog v WHERE v.chapter.manga.id = :mangaId AND v.isAuthenticated = :isAuthenticated")
    long countByMangaIdAndIsAuthenticated(@Param("mangaId") String mangaId, @Param("isAuthenticated") boolean isAuthenticated);
}
