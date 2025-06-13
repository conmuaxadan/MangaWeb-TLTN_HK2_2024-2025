package com.raindrop.comment_service.repository;

import com.raindrop.comment_service.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, String> {
    List<Comment> findByChapterId(String chapterId);
    Page<Comment> findByChapterId(String chapterId, Pageable pageable);
    List<Comment> findByMangaId(String mangaId);
    Page<Comment> findByMangaId(String mangaId, Pageable pageable);
    List<Comment> findByUserId(String userId);
    Page<Comment> findByUserId(String userId, Pageable pageable);

    // Đếm số bình luận theo mangaId
    long countByMangaId(String mangaId);

    // Lấy danh sách bình luận mới nhất
    Page<Comment> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // Tìm kiếm bình luận theo nội dung
    @Query("SELECT c FROM Comment c WHERE LOWER(c.content) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Comment> searchByContent(@Param("keyword") String keyword, Pageable pageable);

    // Tìm kiếm bình luận theo userId
    @Query("SELECT c FROM Comment c WHERE c.userId = :userId")
    Page<Comment> searchByUserId(@Param("userId") String userId, Pageable pageable);

    // Tìm kiếm bình luận theo mangaId
    @Query("SELECT c FROM Comment c WHERE c.mangaId = :mangaId")
    Page<Comment> searchByMangaId(@Param("mangaId") String mangaId, Pageable pageable);

    // Tìm kiếm bình luận theo chapterId
    @Query("SELECT c FROM Comment c WHERE c.chapterId = :chapterId")
    Page<Comment> searchByChapterId(@Param("chapterId") String chapterId, Pageable pageable);

    // Đếm tổng số bình luận trong hệ thống
    @Query("SELECT COUNT(c) FROM Comment c")
    long countTotalComments();

    // Đếm số bình luận mới trong ngày hôm nay
    @Query("SELECT COUNT(c) FROM Comment c WHERE DATE(c.createdAt) = CURRENT_DATE")
    long countTodayComments();
}
