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
    List<Comment> findByProfileId(String profileId);
    Page<Comment> findByProfileId(String profileId, Pageable pageable);

    // Đếm số bình luận theo mangaId
    long countByMangaId(String mangaId);

    // Lấy danh sách bình luận mới nhất
    Page<Comment> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
