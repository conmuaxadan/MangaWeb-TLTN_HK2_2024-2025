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
    
    // Check if chapter number already exists for a manga
    boolean existsByMangaAndChapterNumber(Manga manga, double chapterNumber);
    
    Set<Chapter> findByManga(Manga manga);
    List<Chapter> findByMangaId(String mangaId);
    Page<Chapter> findAll(Pageable pageable);

    int countByMangaId(String mangaId);

    @Modifying
    @Transactional
    @Query("UPDATE Chapter c SET c.views = c.views + 1 WHERE c.id = :id")
    int incrementViews(@Param("id") String id);

    @Modifying
    @Transactional
    @Query("UPDATE Chapter c SET c.comments = c.comments + 1 WHERE c.id = :id")
    int incrementComments(@Param("id") String id);

    @Modifying
    @Transactional
    @Query("UPDATE Chapter c SET c.comments = CASE WHEN c.comments > 0 THEN c.comments - 1 ELSE 0 END WHERE c.id = :id")
    int decrementComments(@Param("id") String id);

    @Query("SELECT SUM(c.views) FROM Chapter c WHERE c.manga.id = :mangaId")
    Integer sumViewsByMangaId(@Param("mangaId") String mangaId);

    @Query("SELECT SUM(c.comments) FROM Chapter c WHERE c.manga.id = :mangaId")
    Integer sumCommentsByMangaId(@Param("mangaId") String mangaId);

    @Query("SELECT c FROM Chapter c WHERE c.manga.id = :mangaId ORDER BY c.chapterNumber DESC")
    List<Chapter> findByMangaIdOrderByChapterNumberDesc(@Param("mangaId") String mangaId);

    // ==================== BATCH QUERIES WITH EAGER LOADING ====================

    @Query("SELECT DISTINCT c FROM Chapter c " +
            "LEFT JOIN FETCH c.pages p " +
            "LEFT JOIN FETCH c.manga m " +
            "ORDER BY c.createdAt DESC")
    Page<Chapter> findAllWithPagesAndManga(Pageable pageable);

    @Query("SELECT DISTINCT c FROM Chapter c " +
            "LEFT JOIN FETCH c.pages p " +
            "WHERE c.manga.id = :mangaId " +
            "ORDER BY c.chapterNumber ASC")
    List<Chapter> findByMangaIdWithPages(@Param("mangaId") String mangaId);

    @Query("SELECT DISTINCT c FROM Chapter c " +
            "LEFT JOIN FETCH c.pages p " +
            "WHERE c.manga.id = :mangaId")
    Page<Chapter> findByMangaIdWithPagesPaginated(@Param("mangaId") String mangaId, Pageable pageable);

    @Query("SELECT c FROM Chapter c " +
            "LEFT JOIN FETCH c.pages p " +
            "LEFT JOIN FETCH c.manga m " +
            "WHERE c.id = :id")
    Optional<Chapter> findByIdWithPagesAndManga(@Param("id") String id);

    // Thêm các phương thức tìm kiếm theo người tạo
    Page<Chapter> findByCreatedBy(String createdBy, Pageable pageable);

    @Query("SELECT c FROM Chapter c WHERE c.manga.id = :mangaId AND c.createdBy = :createdBy")
    List<Chapter> findByMangaIdAndCreatedBy(@Param("mangaId") String mangaId, @Param("createdBy") String createdBy);

    Page<Chapter> findByCreatedByAndTitleContainingIgnoreCase(String createdBy, String keyword, Pageable pageable);

    @Query("SELECT DISTINCT c FROM Chapter c " +
            "LEFT JOIN FETCH c.pages p " +
            "LEFT JOIN FETCH c.manga m " +
            "WHERE (:mangaId IS NULL OR c.manga.id = :mangaId) " +
            "ORDER BY c.manga.title ASC, c.chapterNumber ASC")
    Page<Chapter> searchAndFilterChaptersWithPages(
            @Param("mangaId") String mangaId,
            Pageable pageable);


}

