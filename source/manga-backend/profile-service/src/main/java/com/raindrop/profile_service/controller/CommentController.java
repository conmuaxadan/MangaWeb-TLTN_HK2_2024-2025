package com.raindrop.profile_service.controller;

import com.raindrop.profile_service.dto.request.CommentRequest;
import com.raindrop.profile_service.dto.response.ApiResponse;
import com.raindrop.profile_service.dto.response.CommentResponse;
import com.raindrop.profile_service.service.CommentService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/comments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CommentController {
    CommentService commentService;

    /**
     * Tạo bình luận mới
     * @param jwt JWT token
     * @param request Thông tin bình luận
     * @return Thông tin bình luận đã tạo
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CommentResponse> createComment(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid CommentRequest request
    ) {
        String userId = jwt.getSubject();
        return ApiResponse.<CommentResponse>builder()
                .message("Comment created successfully")
                .result(commentService.createComment(userId, request))
                .build();
    }

    /**
     * Lấy danh sách bình luận của một chapter
     * @param chapterId ID của chapter
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận có phân trang
     */
    @GetMapping("/chapter/{chapterId}")
    public ApiResponse<Page<CommentResponse>> getCommentsByChapterId(
            @PathVariable String chapterId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return ApiResponse.<Page<CommentResponse>>builder()
                .message("Comments retrieved successfully")
                .result(commentService.getCommentsByChapterId(chapterId, pageable))
                .build();
    }

    /**
     * Đếm số bình luận của một manga
     * @param mangaId ID của manga
     * @return Tổng số bình luận
     */
    @GetMapping("/count/manga/{mangaId}")
    public ApiResponse<Long> countCommentsByMangaId(@PathVariable String mangaId) {
        return ApiResponse.<Long>builder()
                .message("Comment count retrieved successfully")
                .result(commentService.countCommentsByMangaId(mangaId))
                .build();
    }

    /**
     * Lấy danh sách bình luận của người dùng hiện tại
     * @param jwt JWT token
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận có phân trang
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<CommentResponse>> getMyComments(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        String userId = jwt.getSubject();
        return ApiResponse.<Page<CommentResponse>>builder()
                .message("My comments retrieved successfully")
                .result(commentService.getCommentsByUserId(userId, pageable))
                .build();
    }

    /**
     * Xóa bình luận
     * @param jwt JWT token
     * @param commentId ID của bình luận
     * @return Thông báo kết quả
     */
    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> deleteComment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String commentId
    ) {
        String userId = jwt.getSubject();
        commentService.deleteComment(userId, commentId);
        return ApiResponse.<Void>builder()
                .message("Comment deleted successfully")
                .build();
    }

    /**
     * Cập nhật bình luận
     * @param jwt JWT token
     * @param commentId ID của bình luận
     * @param content Nội dung mới
     * @return Thông tin bình luận đã cập nhật
     */
    @PutMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CommentResponse> updateComment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String commentId,
            @RequestBody String content
    ) {
        String userId = jwt.getSubject();
        return ApiResponse.<CommentResponse>builder()
                .message("Comment updated successfully")
                .result(commentService.updateComment(userId, commentId, content))
                .build();
    }
}
