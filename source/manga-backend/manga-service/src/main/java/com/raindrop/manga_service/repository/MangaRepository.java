package com.raindrop.manga_service.repository;

import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.enums.MangaStatus;
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
    // Tìm manga theo tiêu đề và chưa bị xóa
    Manga findByTitleAndDeletedFalse(String name);

    // Tìm manga theo tiêu đề (bất kể đã xóa hay chưa)
    Manga findByTitle(String name);

    // Tìm manga theo ID và chưa bị xóa
    Optional<Manga> findByIdAndDeletedFalse(String mangaId);

    // Tìm manga theo ID (bất kể đã xóa hay chưa)
    Optional<Manga> findById(String mangaId);

    // Tìm tất cả manga chưa bị xóa
    List<Manga> findByDeletedFalse();

    // Tìm tất cả manga đã bị xóa
    List<Manga> findByDeletedTrue();

    // Phân trang cho manga chưa bị xóa
    Page<Manga> findByDeletedFalse(Pageable pageable);

    // Phân trang cho manga đã bị xóa
    Page<Manga> findByDeletedTrue(Pageable pageable);

    /**
     * Tăng lượt xem của manga mà không cập nhật thời gian updatedAt
     *
     * @param id ID của manga
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.views = m.views + 1 WHERE m.id = :id")
    int incrementViews(@Param("id") String id);

    /**
     * Tăng số lượng comment của manga
     *
     * @param id ID của manga
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.comments = m.comments + 1 WHERE m.id = :id")
    int incrementComments(@Param("id") String id);

    /**
     * Giảm số lượng comment của manga
     *
     * @param id ID của manga
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.comments = CASE WHEN m.comments > 0 THEN m.comments - 1 ELSE 0 END WHERE m.id = :id")
    int decrementComments(@Param("id") String id);

    /**
     * Cập nhật tổng số lượt xem của manga bằng tổng số lượt xem của tất cả các chapter
     *
     * @param mangaId    ID của manga
     * @param totalViews Tổng số lượt xem
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.views = :totalViews WHERE m.id = :mangaId")
    int updateTotalViews(@Param("mangaId") String mangaId, @Param("totalViews") int totalViews);

    /**
     * Cập nhật tổng số comment của manga bằng tổng số comment của tất cả các chapter
     *
     * @param mangaId       ID của manga
     * @param totalComments Tổng số comment
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.comments = :totalComments WHERE m.id = :mangaId")
    int updateTotalComments(@Param("mangaId") String mangaId, @Param("totalComments") int totalComments);

    /**
     * Tìm các manga có lượt xem cao nhất
     *
     * @param pageable Thông tin phân trang và số lượng cần lấy
     * @return Danh sách manga có lượt xem cao nhất
     */
    List<Manga> findByOrderByViewsDesc(Pageable pageable);

    /**
     * Tìm các manga dựa trên thể loại, loại trừ các manga đã đọc gần đây
     *
     * @param genres          Danh sách thể loại ưu tiên
     * @param excludeMangaIds Danh sách ID manga cần loại trừ
     * @param pageable        Thông tin phân trang
     * @return Danh sách manga phù hợp
     */
    @Query(value = "SELECT DISTINCT m.* FROM manga m "
            + "JOIN manga_genres mg ON m.id = mg.manga_id "
            + "JOIN genre g ON mg.genres_id = g.id "
            + "WHERE g.name IN :genres "
            + "AND m.id NOT IN :excludeMangaIds "
            + "AND m.deleted = false "
            + "ORDER BY m.views DESC",
            nativeQuery = true)
    List<Manga> findMangasByGenres(
            @Param("genres") List<String> genres,
            @Param("excludeMangaIds") List<String> excludeMangaIds,
            Pageable pageable);

    /**
     * Lấy tất cả các tên thể loại trong hệ thống
     *
     * @return Danh sách tên thể loại
     */
    @Query("SELECT DISTINCT g.name FROM Genre g ORDER BY g.name")
    List<String> findAllGenreNames();

    /**
     * Tìm kiếm manga theo từ khóa
     *
     * @param keyword  Từ khóa tìm kiếm (tìm trong tiêu đề hoặc tác giả)
     * @param pageable Thông tin phân trang
     * @return Danh sách manga phù hợp với từ khóa
     */
    @Query("SELECT m FROM Manga m WHERE LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.author) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY m.views DESC")
    Page<Manga> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Tìm kiếm manga theo thể loại
     *
     * @param genreName Tên thể loại
     * @param pageable  Thông tin phân trang
     * @return Danh sách manga thuộc thể loại
     */
    @Query("SELECT DISTINCT m FROM Manga m JOIN m.genres g WHERE g.name = :genreName AND m.deleted = false ORDER BY m.lastChapterAddedAt DESC")
    Page<Manga> findByGenre(@Param("genreName") String genreName, Pageable pageable);

    /**
     * Tìm kiếm và lọc manga theo nhiều tiêu chí (chưa bị xóa)
     *
     * @param keyword       Từ khóa tìm kiếm (title hoặc author)
     * @param genreName     Tên thể loại (nếu có)
     * @param status        Trạng thái manga (nếu có)
     * @param yearOfRelease Năm phát hành (nếu có)
     * @param pageable      Thông tin phân trang
     * @return Danh sách manga phù hợp với tiêu chí
     */
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

    /**
     * Tìm kiếm và lọc manga theo nhiều tiêu chí (đã bị xóa)
     *
     * @param keyword       Từ khóa tìm kiếm (title hoặc author)
     * @param genreName     Tên thể loại (nếu có)
     * @param status        Trạng thái manga (nếu có)
     * @param yearOfRelease Năm phát hành (nếu có)
     * @param pageable      Thông tin phân trang
     * @return Danh sách manga đã xóa phù hợp với tiêu chí
     */
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
