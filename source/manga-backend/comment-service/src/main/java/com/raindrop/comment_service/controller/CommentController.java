package com.raindrop.comment_service.controller;

import com.raindrop.comment_service.dto.request.CommentRequest;
import com.raindrop.comment_service.dto.response.ApiResponse;
import com.raindrop.comment_service.dto.response.CommentResponse;
import com.raindrop.comment_service.service.CommentService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
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
                .code(1000)
                .message("Comment created successfully")
                .result(commentService.createComment(userId, request))
                .build();
    }

    /**
     * Lấy danh sách bình luận theo chapterId
     * @param chapterId ID của chapter
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận có phân trang
     */
    @GetMapping("/chapters/{chapterId}")
    public ApiResponse<Page<CommentResponse>> getCommentsByChapterId(
            @PathVariable String chapterId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return ApiResponse.<Page<CommentResponse>>builder()
                .code(1000)
                .message("Comments retrieved successfully")
                .result(commentService.getCommentsByChapterId(chapterId, pageable))
                .build();
    }

    /**
     * Lấy danh sách bình luận theo mangaId
     * @param mangaId ID của manga
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận có phân trang
     */
    @GetMapping("/mangas/{mangaId}")
    public ApiResponse<Page<CommentResponse>> getCommentsByMangaId(
            @PathVariable String mangaId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return ApiResponse.<Page<CommentResponse>>builder()
                .code(1000)
                .message("Comments retrieved successfully")
                .result(commentService.getCommentsByMangaId(mangaId, pageable))
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
                .code(1000)
                .message("My comments retrieved successfully")
                .result(commentService.getCommentsByUserId(userId, pageable))
                .build();
    }

    /**
     * Lấy danh sách bình luận mới nhất
     * @param pageable Thông tin phân trang
     * @return Danh sách bình luận có phân trang
     */
    @GetMapping("/latest")
    public ApiResponse<Page<CommentResponse>> getLatestComments(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return ApiResponse.<Page<CommentResponse>>builder()
                .code(1000)
                .message("Latest comments retrieved successfully")
                .result(commentService.getLatestComments(pageable))
                .build();
    }

    /**
     * Đếm số bình luận của một manga
     * @param mangaId ID của manga
     * @return Số lượng bình luận
     */
    @GetMapping("/mangas/{mangaId}/count")
    public ApiResponse<Long> countCommentsByMangaId(
            @PathVariable String mangaId
    ) {
        log.info("Counting comments for manga: {}", mangaId);
        return ApiResponse.<Long>builder()
                .code(1000)
                .message("Comments counted successfully")
                .result(commentService.countCommentsByMangaId(mangaId))
                .build();
    }

    /**
     * Xóa bình luận
     * @param jwt JWT token
     * @param commentId ID của bình luận
     * @return Thông báo xóa thành công
     */
    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteComment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String commentId
    ) {
        String userId = jwt.getSubject();
        commentService.deleteComment(commentId, userId);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Comment deleted successfully")
                .build();
    }
}
