package com.raindrop.history_service.controller;

import com.raindrop.history_service.dto.request.HistoryRequest;
import com.raindrop.history_service.dto.response.ApiResponse;
import com.raindrop.history_service.dto.response.HistoryResponse;
import com.raindrop.history_service.service.HistoryService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/histories")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class HistoryController {
    HistoryService historyService;

    @GetMapping
    public ApiResponse<Page<HistoryResponse>> getCurrentUserReadingHistory(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 10, sort = "updatedAt") Pageable pageable
    ) {
        String userId = jwt.getSubject();
        Page<HistoryResponse> readingHistory = historyService.getReadingHistory(userId, pageable);

        return ApiResponse.<Page<HistoryResponse>>builder()
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build();
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<Page<HistoryResponse>> getUserReadingHistory(
            @PathVariable String userId,
            @PageableDefault(size = 10, sort = "updatedAt") Pageable pageable
    ) {
        Page<HistoryResponse> readingHistory = historyService.getReadingHistory(userId, pageable);

        return ApiResponse.<Page<HistoryResponse>>builder()
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build();
    }

    @PostMapping
    public ApiResponse<HistoryResponse> markChapterAsReadForCurrentUser(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid HistoryRequest request
    ) {
        String userId = jwt.getSubject();
        HistoryResponse response = historyService.markChapterAsRead(userId, request);

        return ApiResponse.<HistoryResponse>builder()
                .code(201)
                .message("Chapter marked as read successfully")
                .result(response)
                .build();
    }

    @PostMapping("/user/{userId}")
    public ApiResponse<HistoryResponse> markChapterAsReadForUser(
            @PathVariable String userId,
            @RequestBody @Valid HistoryRequest request
    ) {
        HistoryResponse response = historyService.markChapterAsRead(userId, request);

        return ApiResponse.<HistoryResponse>builder()
                .code(201)
                .message("Chapter marked as read successfully")
                .result(response)
                .build();
    }

    @GetMapping("/manga/{mangaId}")
    public ApiResponse<HistoryResponse> getMangaReadingHistoryForCurrentUser(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String mangaId
    ) {
        String userId = jwt.getSubject();
        HistoryResponse readingHistory = historyService.getMangaReadingHistory(userId, mangaId);

        return ApiResponse.<HistoryResponse>builder()
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build();
    }

    @GetMapping("/user/{userId}/manga/{mangaId}")
    public ApiResponse<HistoryResponse> getMangaReadingHistoryForUser(
            @PathVariable String userId,
            @PathVariable String mangaId
    ) {
        HistoryResponse readingHistory = historyService.getMangaReadingHistory(userId, mangaId);

        return ApiResponse.<HistoryResponse>builder()
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build();
    }

    @GetMapping("/recent")
    public ApiResponse<List<HistoryResponse>> getRecentReadingHistoryForCurrentUser(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "3") int limit
    ) {
        String userId = jwt.getSubject();
        List<HistoryResponse> recentHistory = historyService.getRecentReadingHistory(userId, limit);
        return ApiResponse.<List<HistoryResponse>>builder()
                .message("Recent reading history retrieved successfully")
                .result(recentHistory)
                .build();
    }

    @GetMapping("/user/{userId}/recent")
    public ApiResponse<List<HistoryResponse>> getRecentReadingHistoryForUser(
            @PathVariable String userId,
            @RequestParam(defaultValue = "3") int limit
    ) {
        List<HistoryResponse> recentHistory = historyService.getRecentReadingHistory(userId, limit);

        return ApiResponse.<List<HistoryResponse>>builder()
                .message("Recent reading history retrieved successfully")
                .result(recentHistory)
                .build();
    }

    @GetMapping("/manga-ids")
    public ApiResponse<List<String>> getAllReadMangaIdsForCurrentUser(
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        List<String> mangaIds = historyService.getAllReadMangaIds(userId);

        return ApiResponse.<List<String>>builder()
                .message("Read manga IDs retrieved successfully")
                .result(mangaIds)
                .build();
    }

    @GetMapping("/user/{userId}/manga-ids")
    public ApiResponse<List<String>> getAllReadMangaIds(
            @PathVariable String userId
    ) {
        List<String> mangaIds = historyService.getAllReadMangaIds(userId);

        return ApiResponse.<List<String>>builder()
                .message("Read manga IDs retrieved successfully")
                .result(mangaIds)
                .build();
    }
}
