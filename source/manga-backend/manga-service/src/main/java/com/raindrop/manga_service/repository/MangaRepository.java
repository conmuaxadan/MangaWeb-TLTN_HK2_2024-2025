package com.raindrop.manga_service.repository;

import com.raindrop.manga_service.entity.Manga;
import org.springframework.data.domain.Page;
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
    Manga findByTitle(String name);
    Optional<Manga> findById(String mangaId);

    /**
     * Tăng lượt xem của manga mà không cập nhật thời gian updatedAt
     * @param id ID của manga
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.views = m.views + 1 WHERE m.id = :id")
    int incrementViews(@Param("id") String id);

    /**
     * Tăng số lượng comment của manga
     * @param id ID của manga
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.comments = m.comments + 1 WHERE m.id = :id")
    int incrementComments(@Param("id") String id);

    /**
     * Giảm số lượng comment của manga
     * @param id ID của manga
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.comments = CASE WHEN m.comments > 0 THEN m.comments - 1 ELSE 0 END WHERE m.id = :id")
    int decrementComments(@Param("id") String id);

    /**
     * Cập nhật tổng số lượt xem của manga bằng tổng số lượt xem của tất cả các chapter
     * @param mangaId ID của manga
     * @param totalViews Tổng số lượt xem
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.views = :totalViews WHERE m.id = :mangaId")
    int updateTotalViews(@Param("mangaId") String mangaId, @Param("totalViews") int totalViews);

    /**
     * Cập nhật tổng số comment của manga bằng tổng số comment của tất cả các chapter
     * @param mangaId ID của manga
     * @param totalComments Tổng số comment
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.comments = :totalComments WHERE m.id = :mangaId")
    int updateTotalComments(@Param("mangaId") String mangaId, @Param("totalComments") int totalComments);

    /**
     * Tìm các manga có lượt xem cao nhất
     * @param pageable Thông tin phân trang và số lượng cần lấy
     * @return Danh sách manga có lượt xem cao nhất
     */
    List<Manga> findByOrderByViewsDesc(Pageable pageable);

    /**
     * Tìm các manga dựa trên thể loại, loại trừ các manga đã đọc gần đây
     * @param genres Danh sách thể loại ưu tiên
     * @param excludeMangaIds Danh sách ID manga cần loại trừ
     * @param pageable Thông tin phân trang
     * @return Danh sách manga phù hợp
     */
    @Query(value = "SELECT DISTINCT m.* FROM manga m "
            + "JOIN manga_genres mg ON m.id = mg.manga_id "
            + "JOIN genre g ON mg.genres_id = g.id "
            + "WHERE g.name IN :genres "
            + "AND m.id NOT IN :excludeMangaIds "
            + "ORDER BY m.views DESC",
            nativeQuery = true)
    List<Manga> findMangasByGenres(
            @Param("genres") List<String> genres,
            @Param("excludeMangaIds") List<String> excludeMangaIds,
            Pageable pageable);

    /**
     * Lấy tất cả các tên thể loại trong hệ thống
     * @return Danh sách tên thể loại
     */
    @Query("SELECT DISTINCT g.name FROM Genre g ORDER BY g.name")
    List<String> findAllGenreNames();

    /**
     * Tìm kiếm manga theo từ khóa
     * @param keyword Từ khóa tìm kiếm (tìm trong tiêu đề hoặc tác giả)
     * @param pageable Thông tin phân trang
     * @return Danh sách manga phù hợp với từ khóa
     */
    @Query("SELECT m FROM Manga m WHERE LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.author) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY m.views DESC")
    Page<Manga> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Tìm kiếm manga theo thể loại
     * @param genreName Tên thể loại
     * @param pageable Thông tin phân trang
     * @return Danh sách manga thuộc thể loại
     */
    @Query("SELECT DISTINCT m FROM Manga m JOIN m.genres g WHERE g.name = :genreName ORDER BY m.lastChapterAddedAt DESC")
    Page<Manga> findByGenre(@Param("genreName") String genreName, Pageable pageable);
}
