package com.raindrop.history_service.controller;

import com.raindrop.history_service.dto.request.HistoryRequest;
import com.raindrop.history_service.dto.response.ApiResponse;
import com.raindrop.history_service.dto.response.HistoryResponse;
import com.raindrop.history_service.service.HistoryService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class HistoryController {
    HistoryService historyService;

    /**
     * Lấy lịch sử đọc của người dùng hiện tại
     * @param jwt JWT token của người dùng
     * @param pageable Thông tin phân trang
     * @return Danh sách lịch sử đọc có phân trang
     */
    @GetMapping
    public ApiResponse<Page<HistoryResponse>> getCurrentUserReadingHistory(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 10, sort = "updatedAt") Pageable pageable
    ) {
        String userId = jwt.getSubject();
        log.info("Getting reading history for current user {}", userId);

        Page<HistoryResponse> readingHistory = historyService.getReadingHistory(userId, pageable);

        return ApiResponse.<Page<HistoryResponse>>builder()
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build();
    }

    /**
     * Lấy lịch sử đọc của người dùng cụ thể
     * @param userId ID của người dùng
     * @param pageable Thông tin phân trang
     * @return Danh sách lịch sử đọc có phân trang
     */
    @GetMapping("/user/{userId}")
    public ApiResponse<Page<HistoryResponse>> getUserReadingHistory(
            @PathVariable String userId,
            @PageableDefault(size = 10, sort = "updatedAt") Pageable pageable
    ) {
        log.info("Getting reading history for user {}", userId);

        Page<HistoryResponse> readingHistory = historyService.getReadingHistory(userId, pageable);

        return ApiResponse.<Page<HistoryResponse>>builder()
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build();
    }

    /**
     * Đánh dấu đã đọc chapter cho người dùng hiện tại
     * @param jwt JWT token của người dùng
     * @param request Thông tin chapter đã đọc
     * @return Thông tin lịch sử đọc
     */
    @PostMapping
    public ApiResponse<HistoryResponse> markChapterAsReadForCurrentUser(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid HistoryRequest request
    ) {
        String userId = jwt.getSubject();
        log.info("Marking chapter {} of manga {} as read for current user {}", request.getChapterId(), request.getMangaId(), userId);

        HistoryResponse response = historyService.markChapterAsRead(userId, request);

        return ApiResponse.<HistoryResponse>builder()
                .code(201)
                .message("Chapter marked as read successfully")
                .result(response)
                .build();
    }

    /**
     * Đánh dấu đã đọc chapter cho người dùng cụ thể
     * @param userId ID của người dùng
     * @param request Thông tin chapter đã đọc
     * @return Thông tin lịch sử đọc
     */
    @PostMapping("/user/{userId}")
    public ApiResponse<HistoryResponse> markChapterAsReadForUser(
            @PathVariable String userId,
            @RequestBody @Valid HistoryRequest request
    ) {
        log.info("Marking chapter {} of manga {} as read for user {}", request.getChapterId(), request.getMangaId(), userId);

        HistoryResponse response = historyService.markChapterAsRead(userId, request);

        return ApiResponse.<HistoryResponse>builder()
                .code(201)
                .message("Chapter marked as read successfully")
                .result(response)
                .build();
    }

    /**
     * Lấy lịch sử đọc của một manga cụ thể cho người dùng hiện tại
     * @param jwt JWT token của người dùng
     * @param mangaId ID của manga
     * @return Thông tin lịch sử đọc
     */
    @GetMapping("/manga/{mangaId}")
    public ApiResponse<HistoryResponse> getMangaReadingHistoryForCurrentUser(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String mangaId
    ) {
        String userId = jwt.getSubject();
        log.info("Getting reading history for manga {} and current user {}", mangaId, userId);

        HistoryResponse readingHistory = historyService.getMangaReadingHistory(userId, mangaId);

        return ApiResponse.<HistoryResponse>builder()
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build();
    }

    /**
     * Lấy lịch sử đọc của một manga cụ thể cho người dùng cụ thể
     * @param userId ID của người dùng
     * @param mangaId ID của manga
     * @return Thông tin lịch sử đọc
     */
    @GetMapping("/user/{userId}/manga/{mangaId}")
    public ApiResponse<HistoryResponse> getMangaReadingHistoryForUser(
            @PathVariable String userId,
            @PathVariable String mangaId
    ) {
        log.info("Getting reading history for manga {} and user {}", mangaId, userId);

        HistoryResponse readingHistory = historyService.getMangaReadingHistory(userId, mangaId);

        return ApiResponse.<HistoryResponse>builder()
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build();
    }

    /**
     * Lấy lịch sử đọc gần đây của người dùng hiện tại (mỗi manga chỉ lấy 1 lần)
     * @param jwt JWT token của người dùng
     * @param limit Số lượng manga cần lấy
     * @return Danh sách lịch sử đọc gần đây
     */
    @GetMapping("/recent")
    public ApiResponse<List<HistoryResponse>> getRecentReadingHistoryForCurrentUser(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "3") int limit
    ) {
        String userId = jwt.getSubject();
        log.info("Getting recent reading history for current user {}, limit: {}", userId, limit);
        List<HistoryResponse> recentHistory = historyService.getRecentReadingHistory(userId, limit);
        return ApiResponse.<List<HistoryResponse>>builder()
                .message("Recent reading history retrieved successfully")
                .result(recentHistory)
                .build();
    }

    /**
     * Lấy lịch sử đọc gần đây của người dùng cụ thể (mỗi manga chỉ lấy 1 lần)
     * @param userId ID của người dùng
     * @param limit Số lượng manga cần lấy
     * @return Danh sách lịch sử đọc gần đây
     */
    @GetMapping("/user/{userId}/recent")
    public ApiResponse<List<HistoryResponse>> getRecentReadingHistoryForUser(
            @PathVariable String userId,
            @RequestParam(defaultValue = "3") int limit
    ) {
        log.info("Getting recent reading history for user {}, limit: {}", userId, limit);

        List<HistoryResponse> recentHistory = historyService.getRecentReadingHistory(userId, limit);

        return ApiResponse.<List<HistoryResponse>>builder()
                .message("Recent reading history retrieved successfully")
                .result(recentHistory)
                .build();
    }

    /**
     * Lấy tất cả mangaId đã đọc của người dùng hiện tại
     * @param jwt JWT token của người dùng
     * @return Danh sách tất cả mangaId đã đọc
     */
    @GetMapping("/manga-ids")
    public ApiResponse<List<String>> getAllReadMangaIdsForCurrentUser(
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        log.info("Getting all read manga IDs for current user {}", userId);

        List<String> mangaIds = historyService.getAllReadMangaIds(userId);

        return ApiResponse.<List<String>>builder()
                .message("Read manga IDs retrieved successfully")
                .result(mangaIds)
                .build();
    }

    /**
     * Lấy tất cả mangaId đã đọc của người dùng cụ thể
     * @param userId ID của người dùng
     * @return Danh sách tất cả mangaId đã đọc
     */
    @GetMapping("/user/{userId}/manga-ids")
    public ApiResponse<List<String>> getAllReadMangaIds(
            @PathVariable String userId
    ) {
        log.info("Getting all read manga IDs for user {}", userId);
        List<String> mangaIds = historyService.getAllReadMangaIds(userId);

        return ApiResponse.<List<String>>builder()
                .message("Read manga IDs retrieved successfully")
                .result(mangaIds)
                .build();
    }
}
