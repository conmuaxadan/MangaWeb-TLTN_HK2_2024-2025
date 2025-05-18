package com.raindrop.history_service.controller;

import com.raindrop.history_service.dto.request.ReadingHistoryRequest;
import com.raindrop.history_service.dto.response.ApiResponse;
import com.raindrop.history_service.dto.response.ReadingHistoryResponse;
import com.raindrop.history_service.service.ReadingHistoryService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reading-histories")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ReadingHistoryController {
    ReadingHistoryService readingHistoryService;

    /**
     * Lấy lịch sử đọc của người dùng hiện tại
     * @param jwt JWT token của người dùng
     * @param pageable Thông tin phân trang
     * @return Danh sách lịch sử đọc có phân trang
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<ReadingHistoryResponse>> getCurrentUserReadingHistory(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 10, sort = "updatedAt") Pageable pageable
    ) {
        String userId = jwt.getSubject();
        log.info("Getting reading history for current user {}", userId);

        Page<ReadingHistoryResponse> readingHistory = readingHistoryService.getReadingHistory(userId, pageable);

        return ApiResponse.<Page<ReadingHistoryResponse>>builder()
                .code(1000)
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
    public ApiResponse<Page<ReadingHistoryResponse>> getUserReadingHistory(
            @PathVariable String userId,
            @PageableDefault(size = 10, sort = "updatedAt") Pageable pageable
    ) {
        log.info("Getting reading history for user {}", userId);

        Page<ReadingHistoryResponse> readingHistory = readingHistoryService.getReadingHistory(userId, pageable);

        return ApiResponse.<Page<ReadingHistoryResponse>>builder()
                .code(1000)
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
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ReadingHistoryResponse> markChapterAsReadForCurrentUser(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid ReadingHistoryRequest request
    ) {
        String userId = jwt.getSubject();
        log.info("Marking chapter {} of manga {} as read for current user {}", request.getChapterId(), request.getMangaId(), userId);

        ReadingHistoryResponse response = readingHistoryService.markChapterAsRead(userId, request);

        return ApiResponse.<ReadingHistoryResponse>builder()
                .code(1000)
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
    public ApiResponse<ReadingHistoryResponse> markChapterAsReadForUser(
            @PathVariable String userId,
            @RequestBody @Valid ReadingHistoryRequest request
    ) {
        log.info("Marking chapter {} of manga {} as read for user {}", request.getChapterId(), request.getMangaId(), userId);

        ReadingHistoryResponse response = readingHistoryService.markChapterAsRead(userId, request);

        return ApiResponse.<ReadingHistoryResponse>builder()
                .code(1000)
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
    public ApiResponse<ReadingHistoryResponse> getMangaReadingHistoryForCurrentUser(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String mangaId
    ) {
        String userId = jwt.getSubject();
        log.info("Getting reading history for manga {} and current user {}", mangaId, userId);

        ReadingHistoryResponse readingHistory = readingHistoryService.getMangaReadingHistory(userId, mangaId);

        return ApiResponse.<ReadingHistoryResponse>builder()
                .code(1000)
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
    public ApiResponse<ReadingHistoryResponse> getMangaReadingHistoryForUser(
            @PathVariable String userId,
            @PathVariable String mangaId
    ) {
        log.info("Getting reading history for manga {} and user {}", mangaId, userId);

        ReadingHistoryResponse readingHistory = readingHistoryService.getMangaReadingHistory(userId, mangaId);

        return ApiResponse.<ReadingHistoryResponse>builder()
                .code(1000)
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
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<ReadingHistoryResponse>> getRecentReadingHistoryForCurrentUser(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "3") int limit
    ) {
        String userId = jwt.getSubject();
        log.info("Getting recent reading history for current user {}, limit: {}", userId, limit);
        List<ReadingHistoryResponse> recentHistory = readingHistoryService.getRecentReadingHistory(userId, limit);
        return ApiResponse.<List<ReadingHistoryResponse>>builder()
                .code(1000)
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
    public ApiResponse<List<ReadingHistoryResponse>> getRecentReadingHistoryForUser(
            @PathVariable String userId,
            @RequestParam(defaultValue = "3") int limit
    ) {
        log.info("Getting recent reading history for user {}, limit: {}", userId, limit);

        List<ReadingHistoryResponse> recentHistory = readingHistoryService.getRecentReadingHistory(userId, limit);

        return ApiResponse.<List<ReadingHistoryResponse>>builder()
                .code(1000)
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

        List<String> mangaIds = readingHistoryService.getAllReadMangaIds(userId);

        return ApiResponse.<List<String>>builder()
                .code(1000)
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
    public ApiResponse<List<String>> getAllReadMangaIdsForUser(
            @PathVariable String userId
    ) {
        log.info("Getting all read manga IDs for user {}", userId);
        List<String> mangaIds = readingHistoryService.getAllReadMangaIds(userId);

        return ApiResponse.<List<String>>builder()
                .code(1000)
                .message("Read manga IDs retrieved successfully")
                .result(mangaIds)
                .build();
    }
}
