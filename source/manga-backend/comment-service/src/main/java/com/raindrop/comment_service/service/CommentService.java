package com.raindrop.comment_service.service;

import com.raindrop.comment_service.dto.request.CommentRequest;
import com.raindrop.comment_service.dto.response.ChapterInfoResponse;
import com.raindrop.comment_service.dto.response.CommentResponse;
import com.raindrop.comment_service.dto.response.UserCommentResponse;
import com.raindrop.comment_service.entity.Comment;
import com.raindrop.comment_service.kafka.CommentEventProducer;
import com.raindrop.comment_service.mapper.CommentMapper;
import com.raindrop.comment_service.repository.CommentRepository;
import com.raindrop.comment_service.repository.httpclient.MangaClient;

import com.raindrop.comment_service.repository.httpclient.UserClient;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentService {
    CommentRepository commentRepository;
    CommentMapper commentMapper;
    CommentEventProducer commentEventProducer;
    UserClient userClient;
    MangaClient mangaClient;

    @Transactional
    public CommentResponse createComment(String userId, CommentRequest request) {
        // Tạo comment chỉ với userId
        Comment comment = commentMapper.toComment(request);
        comment.setUserId(userId);

        comment = commentRepository.save(comment);

        // Gửi event đến Kafka để cập nhật số lượng comment
        commentEventProducer.sendCommentCreatedEvent(comment.getMangaId(), comment.getChapterId());

        // Lấy thông tin đầy đủ cho response
        CommentResponse response = enrichCommentResponse(comment);
        return response;
    }

    private CommentResponse enrichCommentResponse(Comment comment) {
        CommentResponse response = commentMapper.toCommentResponse(comment);

        // Lấy thông tin người dùng từ profile-service
        try {
            // Gọi API mà không cần token xác thực
            var userComment = userClient.getUserProfile(comment.getUserId());
            if (userComment != null && userComment.getResult() != null) {
                UserCommentResponse userProfile = userComment.getResult();
                response.setDisplayName(userProfile.getDisplayName());
                response.setUserAvatarUrl(userProfile.getAvatarUrl());
                response.setUserEnabled(userProfile.getEnabled()); // Thêm trạng thái tài khoản
            } else {
                // Nếu không tìm thấy profile, sử dụng userId làm username
                response.setDisplayName("User_" + comment.getUserId().substring(0, Math.min(8, comment.getUserId().length())));
                response.setUserEnabled(true); // Mặc định là true nếu không có thông tin
            }
        } catch (Exception e) {
            // Nếu có lỗi, sử dụng userId làm username
            response.setDisplayName("User_" + comment.getUserId().substring(0, Math.min(8, comment.getUserId().length())));
            response.setUserEnabled(true); // Mặc định là true nếu không có thông tin
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
            // Silent error handling
        }

        return response;
    }

    public Page<CommentResponse> getCommentsByChapterId(String chapterId, Pageable pageable) {
        Page<Comment> comments = commentRepository.findByChapterId(chapterId, pageable);

        // Lấy thông tin chapter từ manga-service
        ChapterInfoResponse chapterInfo = null;
        try {
            var chapterInfoResponse = mangaClient.getChapterInfo(chapterId);
            if (chapterInfoResponse != null && chapterInfoResponse.getResult() != null) {
                chapterInfo = chapterInfoResponse.getResult();
            }
        } catch (Exception e) {
            // Silent error handling
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

    public Page<CommentResponse> getCommentsByMangaId(String mangaId, Pageable pageable) {
        Page<Comment> comments = commentRepository.findByMangaId(mangaId, pageable);

        return comments.map(this::enrichCommentResponse);
    }

    public Page<CommentResponse> getCommentsByUserId(String userId, Pageable pageable) {
        Page<Comment> comments = commentRepository.findByUserId(userId, pageable);

        return comments.map(this::enrichCommentResponse);
    }

    public Page<CommentResponse> getLatestComments(Pageable pageable) {
        Page<Comment> comments = commentRepository.findAllByOrderByCreatedAtDesc(pageable);

        return comments.map(this::enrichCommentResponse);
    }

    public long countCommentsByMangaId(String mangaId) {
        return commentRepository.countByMangaId(mangaId);
    }

    @Transactional
    public void deleteComment(String commentId, String userId) {
        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            throw new RuntimeException("Comment not found");
        }

        Comment comment = commentOpt.get();

        // Kiểm tra quyền xóa (chỉ người tạo mới được xóa)
        if (!comment.getUserId().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this comment");
        }

        commentRepository.delete(comment);

        // Gửi event đến Kafka để cập nhật số lượng comment
        commentEventProducer.sendCommentDeletedEvent(comment.getMangaId(), comment.getChapterId());
    }

    public Page<CommentResponse> getAllComments(Pageable pageable) {
        Page<Comment> comments = commentRepository.findAll(pageable);
        return comments.map(this::enrichCommentResponse);
    }

    @Transactional
    public void adminDeleteComment(String commentId) {
        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            throw new RuntimeException("Comment not found");
        }

        Comment comment = commentOpt.get();
        commentRepository.delete(comment);

        // Gửi event đến Kafka để cập nhật số lượng comment
        commentEventProducer.sendCommentDeletedEvent(comment.getMangaId(), comment.getChapterId());
    }

    public Page<CommentResponse> searchComments(String keyword, Pageable pageable) {

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

    public long countTotalComments() {
        return commentRepository.countTotalComments();
    }

    public long countTodayComments() {
        return commentRepository.countTodayComments();
    }
}
