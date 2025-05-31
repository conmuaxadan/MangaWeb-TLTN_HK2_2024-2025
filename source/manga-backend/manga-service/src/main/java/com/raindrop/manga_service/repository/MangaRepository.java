package com.raindrop.manga_service.repository;

import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.enums.MangaStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface MangaRepository extends JpaRepository<Manga, String>, JpaSpecificationExecutor<Manga> {
    Manga findByTitleAndDeletedFalse(String name);
    Manga findByTitle(String name);
    Optional<Manga> findByIdAndDeletedFalse(String mangaId);
    Optional<Manga> findById(String mangaId);
    List<Manga> findByDeletedFalse();
    List<Manga> findByDeletedTrue();
    Page<Manga> findByDeletedFalse(Pageable pageable);
    Page<Manga> findAllByDeletedFalse(Specification<Manga>spec, Pageable pageable);
    Page<Manga> findByDeletedTrue(Pageable pageable);

    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.views = m.views + 1 WHERE m.id = :id")
    int incrementViews(@Param("id") String id);

    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.comments = m.comments + 1 WHERE m.id = :id")
    int incrementComments(@Param("id") String id);

    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.comments = CASE WHEN m.comments > 0 THEN m.comments - 1 ELSE 0 END WHERE m.id = :id")
    int decrementComments(@Param("id") String id);

    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.views = :totalViews WHERE m.id = :mangaId")
    int updateTotalViews(@Param("mangaId") String mangaId, @Param("totalViews") int totalViews);

    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.comments = :totalComments WHERE m.id = :mangaId")
    int updateTotalComments(@Param("mangaId") String mangaId, @Param("totalComments") int totalComments);

    @Query(value = "SELECT m.* FROM manga m " +
            "JOIN manga_genres mg ON m.id = mg.manga_id " +
            "JOIN genre g ON mg.genres_id = g.id " +
            "WHERE g.name IN :genres " +
            "AND m.id NOT IN :excludeMangaIds " +
            "AND m.deleted = false " +
            "GROUP BY m.id " +
            "HAVING COUNT(DISTINCT g.name) = :genreCount " +
            "ORDER BY m.views DESC",
            nativeQuery = true)
    List<Manga> findMangasByAllGenres(
            @Param("genres") List<String> genres,
            @Param("genreCount") int genreCount,
            @Param("excludeMangaIds") List<String> excludeMangaIds,
            Pageable pageable);

    @Query("SELECT DISTINCT m FROM Manga m LEFT JOIN FETCH m.genres WHERE m.id IN :mangaIds")
    List<Manga> findAllByIdWithGenres(@Param("mangaIds") List<String> mangaIds);

    @Query("SELECT m.id as mangaId, c.chapterNumber as lastChapterNumber " +
           "FROM Manga m LEFT JOIN Chapter c ON m.lastChapterId = c.id " +
           "WHERE m.id IN :mangaIds AND m.lastChapterId IS NOT NULL")
    List<Object[]> findLastChapterNumbersByMangaIds(@Param("mangaIds") List<String> mangaIds);

    @Query("SELECT c.manga.id as mangaId, COUNT(c) as chapterCount " +
           "FROM Chapter c WHERE c.manga.id IN :mangaIds GROUP BY c.manga.id")
    List<Object[]> findChapterCountsByMangaIds(@Param("mangaIds") List<String> mangaIds);

    @Query("SELECT c.manga.id as mangaId, c.id as chapterId, c.chapterNumber " +
           "FROM Chapter c WHERE c.manga.id IN :mangaIds ORDER BY c.manga.id, c.chapterNumber")
    List<Object[]> findChapterIdsByMangaIds(@Param("mangaIds") List<String> mangaIds);

    @Query("SELECT COUNT(m) FROM Manga m WHERE m.deleted = false")
    Long countActiveMangas();

    @Query("SELECT COUNT(m) FROM Manga m WHERE m.deleted = true")
    Long countDeletedMangas();

    @Query("SELECT COUNT(m) FROM Manga m WHERE m.deleted = false AND DATE(m.createdAt) = CURRENT_DATE")
    Long countNewMangasToday();

    @Query("SELECT m FROM Manga m WHERE LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.author) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY m.views DESC")
    Page<Manga> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT DISTINCT m FROM Manga m JOIN m.genres g WHERE g.name = :genreName AND m.deleted = false ORDER BY m.lastChapterAddedAt DESC")
    Page<Manga> findByGenre(@Param("genreName") String genreName, Pageable pageable);

    @Query("SELECT DISTINCT m FROM Manga m " +
            "LEFT JOIN m.genres g " +
            "WHERE m.deleted = false " +
            "AND (:keyword IS NULL OR " +
            "    LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "    LOWER(m.author) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:genreName IS NULL OR g.name = :genreName) " +
            "AND (:status IS NULL OR m.status = :status) " +
            "AND (:yearOfRelease IS NULL OR m.yearOfRelease = :yearOfRelease)")
    Page<Manga> searchAndFilterActiveMangas(
            @Param("keyword") String keyword,
            @Param("genreName") String genreName,
            @Param("status") MangaStatus status,
            @Param("yearOfRelease") Integer yearOfRelease,
            Pageable pageable);

    @Query("SELECT DISTINCT m FROM Manga m " +
            "LEFT JOIN m.genres g " +
            "WHERE m.deleted = true " +
            "AND (:keyword IS NULL OR " +
            "    LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "    LOWER(m.author) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:genreName IS NULL OR g.name = :genreName) " +
            "AND (:status IS NULL OR m.status = :status) " +
            "AND (:yearOfRelease IS NULL OR m.yearOfRelease = :yearOfRelease)")
    Page<Manga> searchAndFilterDeletedMangas(
            @Param("keyword") String keyword,
            @Param("genreName") String genreName,
            @Param("status") MangaStatus status,
            @Param("yearOfRelease") Integer yearOfRelease,
            Pageable pageable);
}
