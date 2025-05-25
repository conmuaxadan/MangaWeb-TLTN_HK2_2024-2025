package com.raindrop.manga_service.repository;

import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Manga;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ChapterRepository extends JpaRepository<Chapter, String> {
    Chapter findByTitle(String title);
    Optional<Chapter> findByMangaAndChapterNumber(Manga manga, double chapterNumber);
    Set<Chapter> findByManga(Manga manga);
    List<Chapter> findByMangaId(String mangaId);
    Page<Chapter> findAll(Pageable pageable);

    int countByMangaId(String mangaId);

    /**
     * Tìm kiếm và lọc chapter theo manga
     * @param mangaId ID của manga (nếu có)
     * @param pageable Thông tin phân trang
     * @return Danh sách chapter đã được lọc
     */
    @Query("SELECT c FROM Chapter c " +
           "WHERE (:mangaId IS NULL OR c.manga.id = :mangaId) " +
           "ORDER BY c.manga.title ASC, c.chapterNumber ASC")
    Page<Chapter> searchAndFilterChapters(
            @Param("mangaId") String mangaId,
            Pageable pageable);

    /**
     * Tăng lượt xem của chapter mà không cập nhật thời gian updatedAt
     * @param id ID của chapter
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Chapter c SET c.views = c.views + 1 WHERE c.id = :id")
    int incrementViews(@Param("id") String id);

    /**
     * Tăng số lượng comment của chapter
     * @param id ID của chapter
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Chapter c SET c.comments = c.comments + 1 WHERE c.id = :id")
    int incrementComments(@Param("id") String id);

    /**
     * Giảm số lượng comment của chapter
     * @param id ID của chapter
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Chapter c SET c.comments = CASE WHEN c.comments > 0 THEN c.comments - 1 ELSE 0 END WHERE c.id = :id")
    int decrementComments(@Param("id") String id);

    /**
     * Tính tổng số lượt xem của tất cả các chapter của một manga
     * @param mangaId ID của manga
     * @return Tổng số lượt xem
     */
    @Query("SELECT SUM(c.views) FROM Chapter c WHERE c.manga.id = :mangaId")
    Integer sumViewsByMangaId(@Param("mangaId") String mangaId);

    /**
     * Tính t���ng số comment của tất cả các chapter của một manga
     * @param mangaId ID của manga
     * @return Tổng số comment
     */
    @Query("SELECT SUM(c.comments) FROM Chapter c WHERE c.manga.id = :mangaId")
    Integer sumCommentsByMangaId(@Param("mangaId") String mangaId);
}
