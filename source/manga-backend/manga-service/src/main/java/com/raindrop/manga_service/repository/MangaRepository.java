package com.raindrop.manga_service.repository;

import com.raindrop.manga_service.entity.Manga;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

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

}
