package com.raindrop.comment_service.service;

import com.raindrop.comment_service.dto.request.CommentRequest;
import com.raindrop.comment_service.dto.response.CommentResponse;
import com.raindrop.comment_service.dto.response.UserProfileResponse;
import com.raindrop.comment_service.entity.Comment;
import com.raindrop.comment_service.kafka.CommentEventProducer;
import com.raindrop.comment_service.mapper.CommentMapper;
import com.raindrop.comment_service.repository.CommentRepository;
import com.raindrop.comment_service.repository.httpclient.ProfileClient;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CommentService {
    CommentRepository commentRepository;
    CommentMapper commentMapper;
    CommentEventProducer commentEventProducer;
    ProfileClient profileClient;

    /**
     * Tạo bình luận mới
     * @param userId ID của người dùng (từ JWT token)
     * @param request Thông tin bình luận
     * @return Thông tin bình luận đã tạo
     */
    @Transactional
    public CommentResponse createComment(String userId, CommentRequest request) {
        log.info("Creating comment for user ID: {}, chapter: {}", userId, request.getChapterId());
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        var header = attributes.getRequest().getHeader("Authorization");

        // Lấy thông tin profile người dùng từ Profile Service
        var profileResponse = profileClient.getUserProfile(header,userId);
        UserProfileResponse userProfile = profileResponse != null ? profileResponse.getResult() : null;

        // Xử lý thông tin profile
        String username;
        String avatarUrl = null;

        if (userProfile != null) {
            username = userProfile.getDisplayName();
            avatarUrl = userProfile.getAvatarUrl();
            log.info("Found user profile: id={}, displayName={}", userProfile.getId(), username);
        } else {
            // Nếu không tìm thấy profile, sử dụng userId làm username
            username = "User_" + userId.substring(0, Math.min(8, userId.length()));
            log.info("User profile not found, using generated username: {}", username);
        }

        // Tạo comment
        Comment comment = commentMapper.toComment(request);
        comment.setUserId(userId);
        comment.setUsername(username);
        comment.setUserAvatarUrl(avatarUrl);

        comment = commentRepository.save(comment);
        log.info("Comment created with ID: {}", comment.getId());

        // Gửi event đến Kafka để cập nhật số lượng comment
        commentEventProducer.sendCommentCreatedEvent(comment.getMangaId(), comment.getChapterId());

        return commentMapper.toCommentResponse(comment);
    }

    /**
     * Lấy danh sách bình luận theo chapterId
     * @param chapterId ID của chapter
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận có phân trang
     */
    public Page<CommentResponse> getCommentsByChapterId(String chapterId, Pageable pageable) {
        log.info("Getting comments for chapter: {}", chapterId);
        Page<Comment> comments = commentRepository.findByChapterId(chapterId, pageable);

        return comments.map(commentMapper::toCommentResponse);
    }

    /**
     * Lấy danh sách bình luận theo mangaId
     * @param mangaId ID của manga
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận có phân trang
     */
    public Page<CommentResponse> getCommentsByMangaId(String mangaId, Pageable pageable) {
        log.info("Getting comments for manga: {}", mangaId);
        Page<Comment> comments = commentRepository.findByMangaId(mangaId, pageable);

        return comments.map(commentMapper::toCommentResponse);
    }

    /**
     * Lấy danh sách bình luận của người dùng
     * @param userId ID của người dùng
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận có phân trang
     */
    public Page<CommentResponse> getCommentsByUserId(String userId, Pageable pageable) {
        log.info("Getting comments for user: {}", userId);
        Page<Comment> comments = commentRepository.findByUserId(userId, pageable);

        return comments.map(commentMapper::toCommentResponse);
    }

    /**
     * Lấy danh sách bình luận mới nhất
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận có phân trang
     */
    public Page<CommentResponse> getLatestComments(Pageable pageable) {
        log.info("Getting latest comments");
        Page<Comment> comments = commentRepository.findAllByOrderByCreatedAtDesc(pageable);

        return comments.map(commentMapper::toCommentResponse);
    }

    /**
     * Đếm số bình luận của một manga
     * @param mangaId ID của manga
     * @return Số lượng bình luận
     */
    public long countCommentsByMangaId(String mangaId) {
        log.info("Counting comments for manga: {}", mangaId);
        return commentRepository.countByMangaId(mangaId);
    }

    /**
     * Xóa bình luận
     * @param commentId ID của bình luận
     * @param userId ID của người dùng (từ JWT token)
     */
    @Transactional
    public void deleteComment(String commentId, String userId) {
        log.info("Deleting comment: {}", commentId);

        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            log.warn("Comment not found: {}", commentId);
            throw new RuntimeException("Comment not found");
        }

        Comment comment = commentOpt.get();

        // Kiểm tra quyền xóa (chỉ người tạo mới được xóa)
        if (!comment.getUserId().equals(userId)) {
            log.warn("User {} is not authorized to delete comment {}", userId, commentId);
            throw new RuntimeException("You are not authorized to delete this comment");
        }

        commentRepository.delete(comment);
        log.info("Comment deleted: {}", commentId);

        // Gửi event đến Kafka để cập nhật số lượng comment
        commentEventProducer.sendCommentDeletedEvent(comment.getMangaId(), comment.getChapterId());
    }
}
