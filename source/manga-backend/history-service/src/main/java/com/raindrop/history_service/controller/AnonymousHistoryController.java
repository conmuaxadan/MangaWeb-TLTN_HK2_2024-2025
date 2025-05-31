package com.raindrop.history_service.controller;

import com.raindrop.history_service.dto.request.AnonymousHistoryRequest;
import com.raindrop.history_service.dto.response.AnonymousHistoryResponse;
import com.raindrop.history_service.dto.response.ApiResponse;
import com.raindrop.history_service.service.AnonymousHistoryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/anonymous-histories")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AnonymousHistoryController {
    AnonymousHistoryService anonymousHistoryService;

    @PostMapping
    public ApiResponse<AnonymousHistoryResponse> markChapterAsRead(
            @RequestBody @Valid AnonymousHistoryRequest request,
            HttpServletRequest httpRequest
    ) {
        String ipAddress = httpRequest.getRemoteAddr();
        AnonymousHistoryResponse response = anonymousHistoryService.markChapterAsRead(request, ipAddress);

        return ApiResponse.<AnonymousHistoryResponse>builder()
                .code(201)
                .message("Chapter marked as read successfully")
                .result(response)
                .build();
    }

    @GetMapping("/session/{sessionId}")
    public ApiResponse<Page<AnonymousHistoryResponse>> getSessionReadingHistory(
            @PathVariable String sessionId,
            @PageableDefault(size = 10, sort = "updatedAt") Pageable pageable
    ) {
        Page<AnonymousHistoryResponse> readingHistory = anonymousHistoryService.getReadingHistory(sessionId, pageable);

        return ApiResponse.<Page<AnonymousHistoryResponse>>builder()
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build();
    }

    @GetMapping("/session/{sessionId}/manga/{mangaId}")
    public ApiResponse<AnonymousHistoryResponse> getSessionMangaReadingHistory(
            @PathVariable String sessionId,
            @PathVariable String mangaId
    ) {
        AnonymousHistoryResponse readingHistory = anonymousHistoryService.getMangaReadingHistory(sessionId, mangaId);

        return ApiResponse.<AnonymousHistoryResponse>builder()
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build();
    }

    @GetMapping("/sessions/count")
    public ApiResponse<Long> countDistinctSessions() {
        Long count = anonymousHistoryService.countDistinctSessions();

        return ApiResponse.<Long>builder()
                .message("Distinct sessions counted successfully")
                .result(count)
                .build();
    }

    @GetMapping("/views/count")
    public ApiResponse<Long> countTotalViews() {
        Long count = anonymousHistoryService.countTotalViews();

        return ApiResponse.<Long>builder()
                .message("Total views counted successfully")
                .result(count)
                .build();
    }

    @GetMapping("/views/today/count")
    public ApiResponse<Long> countTodayViews() {
        Long count = anonymousHistoryService.countTodayViews();

        return ApiResponse.<Long>builder()
                .message("Today views counted successfully")
                .result(count)
                .build();
    }

    @GetMapping("/manga/{mangaId}/sessions/count")
    public ApiResponse<Long> countDistinctSessionsByMangaId(@PathVariable String mangaId) {
        Long count = anonymousHistoryService.countDistinctSessionsByMangaId(mangaId);

        return ApiResponse.<Long>builder()
                .message("Distinct sessions counted successfully")
                .result(count)
                .build();
    }

    @GetMapping("/chapter/{chapterId}/sessions/count")
    public ApiResponse<Long> countDistinctSessionsByChapterId(@PathVariable String chapterId) {
        Long count = anonymousHistoryService.countDistinctSessionsByChapterId(chapterId);

        return ApiResponse.<Long>builder()
                .message("Distinct sessions counted successfully")
                .result(count)
                .build();
    }
}
