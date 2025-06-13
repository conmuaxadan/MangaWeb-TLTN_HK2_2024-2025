package com.raindrop.comment_service.controller;

import com.raindrop.comment_service.dto.request.CommentRequest;
import com.raindrop.comment_service.dto.response.ApiResponse;
import com.raindrop.comment_service.dto.response.CommentResponse;
import com.raindrop.comment_service.service.CommentService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
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
public class CommentController {
    CommentService commentService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CommentResponse> createComment(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid CommentRequest request
    ) {
        String userId = jwt.getSubject();
        return ApiResponse.<CommentResponse>builder()
                .code(201)
                .message("Comment created successfully")
                .result(commentService.createComment(userId, request))
                .build();
    }

    @GetMapping("/chapters/{chapterId}")
    public ApiResponse<Page<CommentResponse>> getCommentsByChapterId(
            @PathVariable String chapterId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return ApiResponse.<Page<CommentResponse>>builder()
                .code(200)
                .message("Comments retrieved successfully")
                .result(commentService.getCommentsByChapterId(chapterId, pageable))
                .build();
    }

    @GetMapping("/mangas/{mangaId}")
    public ApiResponse<Page<CommentResponse>> getCommentsByMangaId(
            @PathVariable String mangaId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return ApiResponse.<Page<CommentResponse>>builder()
                .code(200)
                .message("Comments retrieved successfully")
                .result(commentService.getCommentsByMangaId(mangaId, pageable))
                .build();
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<CommentResponse>> getMyComments(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        String userId = jwt.getSubject();
        return ApiResponse.<Page<CommentResponse>>builder()
                .code(200)
                .message("My comments retrieved successfully")
                .result(commentService.getCommentsByUserId(userId, pageable))
                .build();
    }

    @GetMapping("/latest")
    public ApiResponse<Page<CommentResponse>> getLatestComments(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        return ApiResponse.<Page<CommentResponse>>builder()
                .code(200)
                .message("Latest comments retrieved successfully")
                .result(commentService.getLatestComments(pageable))
                .build();
    }

    @GetMapping("/mangas/{mangaId}/count")
    public ApiResponse<Long> countCommentsByMangaId(
            @PathVariable String mangaId
    ) {
        return ApiResponse.<Long>builder()
                .code(200)
                .message("Comments counted successfully")
                .result(commentService.countCommentsByMangaId(mangaId))
                .build();
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> deleteComment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String commentId
    ) {
        String userId = jwt.getSubject();
        commentService.deleteComment(commentId, userId);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("Comment deleted successfully")
                .build();
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    public ApiResponse<Page<CommentResponse>> getAllComments(
            @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.<Page<CommentResponse>>builder()
                .code(200)
                .message("All comments retrieved successfully")
                .result(commentService.getAllComments(pageable))
                .build();
    }

    @DeleteMapping("/admin/{commentId}")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
//    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> adminDeleteComment(
            @PathVariable String commentId
    ) {
        commentService.adminDeleteComment(commentId);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("Comment deleted successfully by admin")
                .build();
    }

    @GetMapping("/admin/search")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    public ApiResponse<Page<CommentResponse>> searchComments(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.<Page<CommentResponse>>builder()
                .message("Comments searched successfully")
                .result(commentService.searchComments(keyword, pageable))
                .build();
    }

    @GetMapping("/count")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    public ApiResponse<Long> countTotalComments() {
        return ApiResponse.<Long>builder()
                .message("Total comments counted successfully")
                .result(commentService.countTotalComments())
                .build();
    }

    @GetMapping("/count/today")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    public ApiResponse<Long> countTodayComments() {
        return ApiResponse.<Long>builder()
                .message("Today's comments counted successfully")
                .result(commentService.countTodayComments())
                .build();
    }
}
