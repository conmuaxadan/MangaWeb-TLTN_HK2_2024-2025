package com.raindrop.profile_service.controller;

import com.raindrop.profile_service.dto.request.ReadingHistoryRequest;
import com.raindrop.profile_service.dto.response.ApiResponse;
import com.raindrop.profile_service.dto.response.ReadingHistoryResponse;
import com.raindrop.profile_service.service.ReadingHistoryService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/{userId}/reading-history")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ReadingHistoryController {
    ReadingHistoryService readingHistoryService;
    
    /**
     * Lấy lịch sử đọc của một người dùng
     */
    @GetMapping
    public ApiResponse<List<ReadingHistoryResponse>> getUserReadingHistory(
            @PathVariable String userId) {
        log.info("GET request to get reading history for user: {}", userId);
        return ApiResponse.<List<ReadingHistoryResponse>>builder()
                .message("Reading history retrieved successfully")
                .result(readingHistoryService.getUserReadingHistory(userId))
                .build();
    }
    
    /**
     * Lấy lịch sử đọc của một người dùng với phân trang
     */
    @GetMapping("/paginated")
    public ApiResponse<Page<ReadingHistoryResponse>> getUserReadingHistoryPaginated(
            @PathVariable String userId,
            @PageableDefault(size = 10, sort = "readAt") Pageable pageable) {
        log.info("GET request to get paginated reading history for user: {}", userId);
        return ApiResponse.<Page<ReadingHistoryResponse>>builder()
                .message("Reading history retrieved successfully")
                .result(readingHistoryService.getUserReadingHistoryPaginated(userId, pageable))
                .build();
    }
    
    /**
     * Thêm hoặc cập nhật lịch sử đọc
     */
    @PostMapping
    public ApiResponse<ReadingHistoryResponse> addToReadingHistory(
            @PathVariable String userId,
            @RequestBody @Valid ReadingHistoryRequest request) {
        log.info("POST request to add to reading history for user: {}", userId);
        return ApiResponse.<ReadingHistoryResponse>builder()
                .message("Added to reading history successfully")
                .result(readingHistoryService.addToReadingHistory(userId, request))
                .build();
    }
    
    /**
     * Lấy lịch sử đọc của một manga cụ thể
     */
    @GetMapping("/manga/{mangaId}")
    public ApiResponse<List<ReadingHistoryResponse>> getUserMangaReadingHistory(
            @PathVariable String userId,
            @PathVariable String mangaId) {
        log.info("GET request to get reading history for user: {} and manga: {}", userId, mangaId);
        return ApiResponse.<List<ReadingHistoryResponse>>builder()
                .message("Reading history retrieved successfully")
                .result(readingHistoryService.getUserMangaReadingHistory(userId, mangaId))
                .build();
    }
    
    /**
     * Xóa một mục trong lịch sử đọc
     */
    @DeleteMapping("/{historyId}")
    public ApiResponse<Void> deleteReadingHistory(
            @PathVariable String userId,
            @PathVariable String historyId) {
        log.info("DELETE request to delete reading history entry: {} for user: {}", historyId, userId);
        readingHistoryService.deleteReadingHistory(userId, historyId);
        return ApiResponse.<Void>builder()
                .message("Reading history entry deleted successfully")
                .build();
    }
    
    /**
     * Xóa tất cả lịch sử đọc của một người dùng
     */
    @DeleteMapping
    public ApiResponse<Void> deleteAllReadingHistory(
            @PathVariable String userId) {
        log.info("DELETE request to delete all reading history for user: {}", userId);
        readingHistoryService.deleteAllReadingHistory(userId);
        return ApiResponse.<Void>builder()
                .message("All reading history deleted successfully")
                .build();
    }
}
