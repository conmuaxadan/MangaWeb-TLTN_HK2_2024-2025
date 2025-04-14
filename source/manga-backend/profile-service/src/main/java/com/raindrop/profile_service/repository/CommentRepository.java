package com.raindrop.profile_service.repository;

import com.raindrop.profile_service.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, String> {
    List<Comment> findByChapterId(String chapterId);
    Page<Comment> findByChapterId(String chapterId, Pageable pageable);
    List<Comment> findByMangaId(String mangaId);
    Page<Comment> findByMangaId(String mangaId, Pageable pageable);
    List<Comment> findByUserId(String userId);
    Page<Comment> findByUserId(String userId, Pageable pageable);
    void deleteByUserIdAndId(String userId, String commentId);

    // Đếm số bình luận theo mangaId
    long countByMangaId(String mangaId);
}
