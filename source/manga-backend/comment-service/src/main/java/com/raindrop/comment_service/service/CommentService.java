package com.raindrop.comment_service.service;

import com.raindrop.comment_service.dto.request.CommentRequest;
import com.raindrop.comment_service.dto.response.ChapterInfoResponse;
import com.raindrop.comment_service.dto.response.CommentResponse;
import com.raindrop.comment_service.dto.response.UserProfileResponse;
import com.raindrop.comment_service.entity.Comment;
import com.raindrop.comment_service.kafka.CommentEventProducer;
import com.raindrop.comment_service.mapper.CommentMapper;
import com.raindrop.comment_service.repository.CommentRepository;
import com.raindrop.comment_service.repository.httpclient.MangaClient;
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
    MangaClient mangaClient;

    /**
     * Tạo bình luận mới
     * @param userId ID của người dùng (từ JWT token)
     * @param request Thông tin bình luận
     * @return Thông tin bình luận đã tạo
     */
    @Transactional
    public CommentResponse createComment(String userId, CommentRequest request) {
        log.info("Creating comment for user ID: {}, chapter: {}", userId, request.getChapterId());

        // Tạo comment chỉ với userId
        Comment comment = commentMapper.toComment(request);
        comment.setUserId(userId);

        comment = commentRepository.save(comment);
        log.info("Comment created with ID: {}", comment.getId());

        // Gửi event đến Kafka để cập nhật số lượng comment
        commentEventProducer.sendCommentCreatedEvent(comment.getMangaId(), comment.getChapterId());

        // Lấy thông tin đầy đủ cho response
        CommentResponse response = enrichCommentResponse(comment);
        return response;
    }

    /**
     * Làm phong phú thông tin cho CommentResponse bằng cách lấy thông tin người dùng và chapter
     * @param comment Comment entity
     * @return CommentResponse đã được làm phong phú
     */
    private CommentResponse enrichCommentResponse(Comment comment) {
        CommentResponse response = commentMapper.toCommentResponse(comment);

        // Lấy thông tin người dùng từ profile-service
        try {
            // Gọi API mà không cần token xác thực
            var profileResponse = profileClient.getUserProfile(comment.getUserId());
            if (profileResponse != null && profileResponse.getResult() != null) {
                UserProfileResponse userProfile = profileResponse.getResult();
                response.setUsername(userProfile.getDisplayName());
                response.setUserAvatarUrl(userProfile.getAvatarUrl());
            } else {
                // Nếu không tìm thấy profile, sử dụng userId làm username
                response.setUsername("User_" + comment.getUserId().substring(0, Math.min(8, comment.getUserId().length())));
            }
        } catch (Exception e) {
            log.error("Error getting user profile for user {}: {}", comment.getUserId(), e.getMessage());
            // Nếu có lỗi, sử dụng userId làm username
            response.setUsername("User_" + comment.getUserId().substring(0, Math.min(8, comment.getUserId().length())));
        }

        // Lấy thông tin chapter từ manga-service
        try {
            var chapterInfoResponse = mangaClient.getChapterInfo(comment.getChapterId());
            if (chapterInfoResponse != null && chapterInfoResponse.getResult() != null) {
                ChapterInfoResponse chapterInfo = chapterInfoResponse.getResult();
                response.setChapterNumber(chapterInfo.getChapterNumber());
                response.setChapterTitle(chapterInfo.getTitle());
                response.setMangaTitle(chapterInfo.getMangaTitle());
            }
        } catch (Exception e) {
            log.error("Error getting chapter info for chapter {}: {}", comment.getChapterId(), e.getMessage());
        }

        return response;
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

        // Lấy thông tin chapter từ manga-service
        ChapterInfoResponse chapterInfo = null;
        try {
            var chapterInfoResponse = mangaClient.getChapterInfo(chapterId);
            if (chapterInfoResponse != null && chapterInfoResponse.getResult() != null) {
                chapterInfo = chapterInfoResponse.getResult();
            }
        } catch (Exception e) {
            log.error("Error getting chapter info for chapter {}: {}", chapterId, e.getMessage());
        }

        ChapterInfoResponse finalChapterInfo = chapterInfo;
        return comments.map(comment -> {
            CommentResponse response = enrichCommentResponse(comment);

            // Đã có thông tin chapter từ enrichCommentResponse, nhưng nếu có thông tin chung cho tất cả comment thì sử dụng
            if (finalChapterInfo != null) {
                response.setChapterNumber(finalChapterInfo.getChapterNumber());
                response.setChapterTitle(finalChapterInfo.getTitle());
                response.setMangaTitle(finalChapterInfo.getMangaTitle());
            }

            return response;
        });
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

        return comments.map(this::enrichCommentResponse);
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

        return comments.map(this::enrichCommentResponse);
    }

    /**
     * Lấy danh sách bình luận mới nhất
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận có phân trang
     */
    public Page<CommentResponse> getLatestComments(Pageable pageable) {
        log.info("Getting latest comments");
        Page<Comment> comments = commentRepository.findAllByOrderByCreatedAtDesc(pageable);

        return comments.map(this::enrichCommentResponse);
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

    /**
     * Lấy tất cả bình luận (dành cho admin)
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận có phân trang
     */
    public Page<CommentResponse> getAllComments(Pageable pageable) {
        log.info("Getting all comments for admin");
        Page<Comment> comments = commentRepository.findAll(pageable);
        return comments.map(this::enrichCommentResponse);
    }

    /**
     * Xóa bình luận (dành cho admin)
     * @param commentId ID của bình luận
     */
    @Transactional
    public void adminDeleteComment(String commentId) {
        log.info("Admin deleting comment: {}", commentId);

        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            log.warn("Comment not found: {}", commentId);
            throw new RuntimeException("Comment not found");
        }

        Comment comment = commentOpt.get();
        commentRepository.delete(comment);
        log.info("Comment deleted by admin: {}", commentId);

        // Gửi event đến Kafka để cập nhật số lượng comment
        commentEventProducer.sendCommentDeletedEvent(comment.getMangaId(), comment.getChapterId());
    }

    /**
     * Tìm kiếm bình luận (dành cho admin)
     * @param keyword Từ khóa tìm kiếm
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận có phân trang
     */
    public Page<CommentResponse> searchComments(String keyword, Pageable pageable) {
        log.info("Searching comments with keyword: {}", keyword);

        Page<Comment> comments;
        if (keyword == null || keyword.trim().isEmpty()) {
            // Nếu không có từ khóa, lấy tất cả bình luận
            comments = commentRepository.findAll(pageable);
        } else {
            // Tìm kiếm theo nội dung
            comments = commentRepository.searchByContent(keyword, pageable);
        }

        return comments.map(this::enrichCommentResponse);
    }
}
