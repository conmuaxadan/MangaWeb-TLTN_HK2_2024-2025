package com.raindrop.manga_service.repository;

import com.raindrop.manga_service.entity.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface PageRepository extends JpaRepository<Page, String> {

    // ==================== OPTIMIZED PAGE OPERATIONS ====================

    /**
     * Tìm page theo chapter ID và index
     * @param chapterId ID của chapter
     * @param index Index của page
     * @return Page nếu tìm thấy
     */
    @Query("SELECT p FROM Page p WHERE p.chapter.id = :chapterId AND p.index = :index")
    Optional<Page> findByChapterIdAndIndex(@Param("chapterId") String chapterId, @Param("index") int index);

    /**
     * Xóa tất cả các page thuộc về một chapter ID cụ thể.
     * @param chapterId ID của chapter cần xóa pages.
     */
    @Modifying
    @Query("DELETE FROM Page p WHERE p.chapter.id = :chapterId")
    void deleteByChapterId(@Param("chapterId") String chapterId);

    /**
     * Batch update page indexes
     * @param pageIds Danh sách page IDs
     * @param newIndexes Danh sách indexes mới tương ứng
     */
    @Modifying
    @Transactional
    @Query("UPDATE Page p SET p.index = " +
           "CASE " +
           "WHEN p.id = :pageId1 THEN :index1 " +
           "WHEN p.id = :pageId2 THEN :index2 " +
           "WHEN p.id = :pageId3 THEN :index3 " +
           "WHEN p.id = :pageId4 THEN :index4 " +
           "WHEN p.id = :pageId5 THEN :index5 " +
           "END " +
           "WHERE p.id IN (:pageId1, :pageId2, :pageId3, :pageId4, :pageId5)")
    void batchUpdatePageIndexes(
            @Param("pageId1") String pageId1, @Param("index1") int index1,
            @Param("pageId2") String pageId2, @Param("index2") int index2,
            @Param("pageId3") String pageId3, @Param("index3") int index3,
            @Param("pageId4") String pageId4, @Param("index4") int index4,
            @Param("pageId5") String pageId5, @Param("index5") int index5);

    /**
     * Lấy pages theo chapter ID và sắp xếp theo index
     * @param chapterId ID của chapter
     * @return Danh sách pages đã sắp xếp
     */
    @Query("SELECT p FROM Page p WHERE p.chapter.id = :chapterId ORDER BY p.index ASC")
    List<Page> findByChapterIdOrderByIndex(@Param("chapterId") String chapterId);

    /**
     * Đếm số pages của chapter
     * @param chapterId ID của chapter
     * @return Số lượng pages
     */
    @Query("SELECT COUNT(p) FROM Page p WHERE p.chapter.id = :chapterId")
    int countByChapterId(@Param("chapterId") String chapterId);
}
