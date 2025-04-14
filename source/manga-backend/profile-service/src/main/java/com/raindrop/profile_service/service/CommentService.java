package com.raindrop.profile_service.service;

import com.raindrop.profile_service.dto.request.CommentRequest;
import com.raindrop.profile_service.dto.response.manga.ApiResponse;
import com.raindrop.profile_service.dto.response.ChapterInfoResponse;
import com.raindrop.profile_service.dto.response.CommentResponse;
import com.raindrop.profile_service.dto.response.MangaInfoResponse;
import com.raindrop.profile_service.entity.Comment;
import com.raindrop.profile_service.entity.UserProfile;
import com.raindrop.profile_service.mapper.CommentMapper;
import com.raindrop.profile_service.repository.CommentRepository;
import com.raindrop.profile_service.repository.UserProfileRepository;
import com.raindrop.profile_service.repository.httpclient.MangaClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CommentService {
    CommentRepository commentRepository;
    CommentMapper commentMapper;
    UserProfileRepository userProfileRepository;
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

        // Lấy thông tin profile người dùng
        Optional<UserProfile> userProfileOpt = userProfileRepository.findByUserId(userId);

        // Xử lý thông tin người dùng
        String username;
        String profileId = null;
        String avatarUrl = null;

        if (userProfileOpt.isPresent()) {
            UserProfile userProfile = userProfileOpt.get();
            profileId = userProfile.getId();
            username = userProfile.getDisplayName();
            avatarUrl = userProfile.getAvatarUrl();
            log.info("Found user profile: id={}, displayName={}", profileId, username);
        } else {
            // Nếu không tìm thấy profile, sử dụng userId làm username
            username = "User_" + userId.substring(0, Math.min(8, userId.length()));
            log.info("User profile not found, using generated username: {}", username);
        }

        // Tạo comment
        Comment comment = commentMapper.toComment(request);
        comment.setUserId(userId);
        comment.setProfileId(profileId);
        comment.setUsername(username);

        comment = commentRepository.save(comment);
        log.info("Comment created with ID: {}", comment.getId());

        CommentResponse response = commentMapper.toCommentResponse(comment);
        response.setUserAvatarUrl(avatarUrl);

        return response;
    }

    /**
     * Lấy danh sách bình luận của một chapter
     * @param chapterId ID của chapter
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận có phân trang
     */
    /**
     * Đếm số bình luận của một manga
     * @param mangaId ID của manga
     * @return Tổng số bình luận
     */
    public long countCommentsByMangaId(String mangaId) {
        log.info("Counting comments for manga: {}", mangaId);
        return commentRepository.countByMangaId(mangaId);
    }

    public Page<CommentResponse> getCommentsByChapterId(String chapterId, Pageable pageable) {
        log.info("Getting comments for chapter: {}", chapterId);
        Page<Comment> comments = commentRepository.findByChapterId(chapterId, pageable);

        return comments.map(comment -> {
            CommentResponse response = commentMapper.toCommentResponse(comment);

            // Lấy avatar của người dùng từ profileId nếu có
            if (comment.getProfileId() != null) {
                userProfileRepository.findById(comment.getProfileId())
                    .ifPresent(profile -> response.setUserAvatarUrl(profile.getAvatarUrl()));
            } else {
                // Nếu không có profileId, thử tìm bằng userId
                userProfileRepository.findByUserId(comment.getUserId())
                    .ifPresent(profile -> {
                        response.setUserAvatarUrl(profile.getAvatarUrl());
                        response.setProfileId(profile.getId());

                        // Cập nhật profileId trong comment
                        comment.setProfileId(profile.getId());
                        commentRepository.save(comment);
                    });
            }

            return response;
        });
    }

    /**
     * Lấy danh sách bình luận của một người dùng
     * @param userId ID của người dùng
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận có phân trang
     */
    public Page<CommentResponse> getCommentsByUserId(String userId, Pageable pageable) {
        log.info("Getting comments for user: {}", userId);
        Page<Comment> comments = commentRepository.findByUserId(userId, pageable);

        // Lấy profile của người dùng
        Optional<UserProfile> userProfileOpt = userProfileRepository.findByUserId(userId);
        String profileId = userProfileOpt.map(UserProfile::getId).orElse(null);
        String avatarUrl = userProfileOpt.map(UserProfile::getAvatarUrl).orElse(null);

        return comments.map(comment -> {
            CommentResponse response = commentMapper.toCommentResponse(comment);

            // Gán thông tin profile
            response.setUserAvatarUrl(avatarUrl);

            // Cập nhật profileId trong comment nếu cần
            if (profileId != null && comment.getProfileId() == null) {
                comment.setProfileId(profileId);
                commentRepository.save(comment);
                response.setProfileId(profileId);
            }

            return response;
        });
    }

    /**
     * Xóa bình luận
     * @param userId ID của người dùng (từ JWT token)
     * @param commentId ID của bình luận
     */
    @Transactional
    public void deleteComment(String userId, String commentId) {
        log.info("Deleting comment: {} for user ID: {}", commentId, userId);

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        // Kiểm tra quyền xóa (chỉ người tạo mới được xóa)
        if (!comment.getUserId().equals(userId)) {
            throw new AccessDeniedException("You don't have permission to delete this comment");
        }

        commentRepository.deleteById(commentId);
        log.info("Comment deleted: {}", commentId);
    }

    /**
     * Cập nhật bình luận
     * @param userId ID của người dùng (từ JWT token)
     * @param commentId ID của bình luận
     * @param content Nội dung mới
     * @return Thông tin bình luận đã cập nhật
     */
    @Transactional
    public CommentResponse updateComment(String userId, String commentId, String content) {
        log.info("Updating comment: {} for user ID: {}", commentId, userId);

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        // Kiểm tra quyền cập nhật (chỉ người tạo mới được cập nhật)
        if (!comment.getUserId().equals(userId)) {
            throw new AccessDeniedException("You don't have permission to update this comment");
        }

        // Tìm profile của người dùng nếu chưa acó profileId
        String profileId = comment.getProfileId();
        String avatarUrl = null;

        if (profileId == null) {
            Optional<UserProfile> userProfileOpt = userProfileRepository.findByUserId(userId);
            if (userProfileOpt.isPresent()) {
                UserProfile profile = userProfileOpt.get();
                profileId = profile.getId();
                avatarUrl = profile.getAvatarUrl();
                comment.setProfileId(profileId);
            }
        } else {
            Optional<UserProfile> userProfileOpt = userProfileRepository.findById(profileId);
            if (userProfileOpt.isPresent()) {
                avatarUrl = userProfileOpt.get().getAvatarUrl();
            }
        }

        // Cập nhật nội dung comment
        comment.setContent(content);
        comment = commentRepository.save(comment);

        // Tạo response
        CommentResponse response = commentMapper.toCommentResponse(comment);
        response.setProfileId(profileId);
        response.setUserAvatarUrl(avatarUrl);

        return response;
    }

    /**
     * Lấy danh sách bình luận mới nhất
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận mới nhất có phân trang
     */
    public Page<CommentResponse> getLatestComments(Pageable pageable) {
        log.info("Getting latest comments with page size: {}", pageable.getPageSize());
        Page<Comment> comments = commentRepository.findAllByOrderByCreatedAtDesc(pageable);
        log.info("Retrieved {} latest comments", comments.getContent().size());

        return comments.map(comment -> {
            CommentResponse response = commentMapper.toCommentResponse(comment);

            // Lấy avatar của người dùng từ profileId nếu có
            if (comment.getProfileId() != null) {
                userProfileRepository.findById(comment.getProfileId())
                    .ifPresent(profile -> response.setUserAvatarUrl(profile.getAvatarUrl()));
            } else {
                // Nếu không có profileId, thử tìm bằng userId
                userProfileRepository.findByUserId(comment.getUserId())
                    .ifPresent(profile -> {
                        response.setUserAvatarUrl(profile.getAvatarUrl());
                        response.setProfileId(profile.getId());

                        // Cập nhật profileId trong comment
                        comment.setProfileId(profile.getId());
                        commentRepository.save(comment);
                    });
            }

            // Lấy thông tin manga
            try {
                ApiResponse<MangaInfoResponse> mangaResponse = mangaClient.getMangaById(comment.getMangaId());
                if (mangaResponse != null && mangaResponse.getCode() == 2000 && mangaResponse.getResult() != null) {
                    response.setMangaTitle(mangaResponse.getResult().getTitle());
                }
            } catch (Exception e) {
                log.error("Error getting manga info for ID {}: {}", comment.getMangaId(), e.getMessage());
            }

            // Lấy thông tin chapter
            try {
                ApiResponse<ChapterInfoResponse> chapterResponse = mangaClient.getChapterById(comment.getChapterId());
                if (chapterResponse != null && chapterResponse.getCode() == 2000 && chapterResponse.getResult() != null) {
                    response.setChapterNumber(String.valueOf(chapterResponse.getResult().getChapterNumber()));
                }
            } catch (Exception e) {
                log.error("Error getting chapter info for ID {}: {}", comment.getChapterId(), e.getMessage());
            }

            return response;
        });
    }
}
