package com.raindrop.history_service.controller;

import com.raindrop.history_service.dto.request.AnonymousReadingHistoryRequest;
import com.raindrop.history_service.dto.response.AnonymousReadingHistoryResponse;
import com.raindrop.history_service.dto.response.ApiResponse;
import com.raindrop.history_service.service.AnonymousReadingHistoryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/anonymous-reading-histories")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AnonymousReadingHistoryController {
    AnonymousReadingHistoryService anonymousReadingHistoryService;

    /**
     * Đánh dấu đã đọc chapter cho người dùng không đăng nhập
     * @param request Thông tin chapter đã đọc
     * @param httpRequest HTTP request
     * @return Thông tin lịch sử đọc
     */
    @PostMapping
    public ApiResponse<AnonymousReadingHistoryResponse> markChapterAsRead(
            @RequestBody @Valid AnonymousReadingHistoryRequest request,
            HttpServletRequest httpRequest
    ) {
        String ipAddress = httpRequest.getRemoteAddr();

        log.info("Marking chapter {} of manga {} as read for anonymous user with session {}",
                request.getChapterId(), request.getMangaId(), request.getSessionId());

        AnonymousReadingHistoryResponse response = anonymousReadingHistoryService.markChapterAsRead(request, ipAddress);

        return ApiResponse.<AnonymousReadingHistoryResponse>builder()
                .code(1000)
                .message("Chapter marked as read successfully")
                .result(response)
                .build();
    }

    /**
     * Lấy lịch sử đọc của người dùng không đăng nhập
     * @param sessionId ID phiên của người dùng
     * @param pageable Thông tin phân trang
     * @return Danh sách lịch sử đọc có phân trang
     */
    @GetMapping("/session/{sessionId}")
    public ApiResponse<Page<AnonymousReadingHistoryResponse>> getSessionReadingHistory(
            @PathVariable String sessionId,
            @PageableDefault(size = 10, sort = "updatedAt") Pageable pageable
    ) {
        log.info("Getting reading history for anonymous user with session {}", sessionId);

        Page<AnonymousReadingHistoryResponse> readingHistory = anonymousReadingHistoryService.getReadingHistory(sessionId, pageable);

        return ApiResponse.<Page<AnonymousReadingHistoryResponse>>builder()
                .code(1000)
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build();
    }

    /**
     * Lấy lịch sử đọc của một manga cụ thể cho người dùng không đăng nhập
     * @param sessionId ID phiên của người dùng
     * @param mangaId ID của manga
     * @return Thông tin lịch sử đọc
     */
    @GetMapping("/session/{sessionId}/manga/{mangaId}")
    public ApiResponse<AnonymousReadingHistoryResponse> getSessionMangaReadingHistory(
            @PathVariable String sessionId,
            @PathVariable String mangaId
    ) {
        log.info("Getting reading history for manga {} and anonymous user with session {}", mangaId, sessionId);

        AnonymousReadingHistoryResponse readingHistory = anonymousReadingHistoryService.getMangaReadingHistory(sessionId, mangaId);

        return ApiResponse.<AnonymousReadingHistoryResponse>builder()
                .code(1000)
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build();
    }

    /**
     * Đếm số lượng phiên duy nhất
     * @return Số lượng phiên duy nhất
     */
    @GetMapping("/sessions/count")
    public ApiResponse<Long> countDistinctSessions() {
        Long count = anonymousReadingHistoryService.countDistinctSessions();

        return ApiResponse.<Long>builder()
                .code(1000)
                .message("Distinct sessions counted successfully")
                .result(count)
                .build();
    }

    /**
     * Đếm tổng số lượt xem (mỗi bản ghi là 1 lượt xem chapter)
     * @return Tổng số lượt xem
     */
    @GetMapping("/views/count")
    public ApiResponse<Long> countTotalViews() {
        Long count = anonymousReadingHistoryService.countTotalViews();

        return ApiResponse.<Long>builder()
                .code(1000)
                .message("Total views counted successfully")
                .result(count)
                .build();
    }

    /**
     * Đếm số lượt xem trong ngày hôm nay
     * @return Số lượt xem trong ngày
     */
    @GetMapping("/views/today/count")
    public ApiResponse<Long> countTodayViews() {
        Long count = anonymousReadingHistoryService.countTodayViews();

        return ApiResponse.<Long>builder()
                .code(1000)
                .message("Today views counted successfully")
                .result(count)
                .build();
    }

    /**
     * Đếm số lượng phiên duy nhất đã đọc một manga cụ thể
     * @param mangaId ID của manga
     * @return Số lượng phiên duy nhất
     */
    @GetMapping("/manga/{mangaId}/sessions/count")
    public ApiResponse<Long> countDistinctSessionsByMangaId(@PathVariable String mangaId) {
        Long count = anonymousReadingHistoryService.countDistinctSessionsByMangaId(mangaId);

        return ApiResponse.<Long>builder()
                .code(1000)
                .message("Distinct sessions counted successfully")
                .result(count)
                .build();
    }

    /**
     * Đếm số lượng phiên duy nhất đã đọc một chapter cụ thể
     * @param chapterId ID của chapter
     * @return Số lượng phiên duy nhất
     */
    @GetMapping("/chapter/{chapterId}/sessions/count")
    public ApiResponse<Long> countDistinctSessionsByChapterId(@PathVariable String chapterId) {
        Long count = anonymousReadingHistoryService.countDistinctSessionsByChapterId(chapterId);

        return ApiResponse.<Long>builder()
                .code(1000)
                .message("Distinct sessions counted successfully")
                .result(count)
                .build();
    }
}
