package com.raindrop.profile_service.controller;

import com.raindrop.profile_service.dto.request.ReadingHistoryRequest;
import com.raindrop.profile_service.dto.response.ApiResponse;
import com.raindrop.profile_service.dto.response.ReadingHistoryResponse;
import com.raindrop.profile_service.entity.UserProfile;
import com.raindrop.profile_service.repository.UserProfileRepository;
import com.raindrop.profile_service.service.ReadingHistoryService;
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

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/reading-history")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ReadingHistoryController {
    ReadingHistoryService readingHistoryService;
    UserProfileRepository userProfileRepository;

    /**
     * Đánh dấu đã đọc chapter
     * @param jwt JWT token của người dùng
     * @param request Thông tin chapter đã đọc
     * @return Thông tin lịch sử đọc
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReadingHistoryResponse>> markChapterAsRead(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid ReadingHistoryRequest request
    ) {
        String userId = jwt.getSubject();
        log.info("Marking chapter {} of manga {} as read for user {}", request.getChapterId(), request.getMangaId(), userId);

        ReadingHistoryResponse response = readingHistoryService.markChapterAsRead(userId, request);

        return ResponseEntity.ok(ApiResponse.<ReadingHistoryResponse>builder()
                .code(1000)
                .message("Chapter marked as read successfully")
                .result(response)
                .build());
    }

    /**
     * Lấy lịch sử đọc của người dùng
     * @param jwt JWT token của người dùng
     * @param pageable Thông tin phân trang
     * @return Danh sách lịch sử đọc có phân trang
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<ReadingHistoryResponse>>> getReadingHistory(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 10, sort = "updatedAt") Pageable pageable
    ) {
        String userId = jwt.getSubject();
        log.info("Getting reading history for user {}", userId);

        Page<ReadingHistoryResponse> readingHistory = readingHistoryService.getReadingHistory(userId, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<ReadingHistoryResponse>>builder()
                .code(1000)
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build());
    }

    /**
     * Lấy lịch sử đọc của một manga cụ thể
     * @param jwt JWT token của người dùng
     * @param mangaId ID của manga
     * @return Thông tin lịch sử đọc
     */
    @GetMapping("/manga/{mangaId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReadingHistoryResponse>> getMangaReadingHistory(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String mangaId
    ) {
        String userId = jwt.getSubject();
        log.info("Getting reading history for manga {} and user {}", mangaId, userId);

        ReadingHistoryResponse readingHistory = readingHistoryService.getMangaReadingHistory(userId, mangaId);

        return ResponseEntity.ok(ApiResponse.<ReadingHistoryResponse>builder()
                .code(1000)
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build());
    }



    /**
     * Xóa lịch sử đọc
     * @param jwt JWT token của người dùng
     * @param historyId ID của lịch sử đọc
     * @return Thông báo kết quả
     */
    @DeleteMapping("/{historyId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteReadingHistory(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String historyId
    ) {
        String userId = jwt.getSubject();
        log.info("Deleting reading history {} for user {}", historyId, userId);

        readingHistoryService.deleteReadingHistory(userId, historyId);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000)
                .message("Reading history deleted successfully")
                .build());
    }

    /**
     * Lấy lịch sử đọc gần đây của người dùng cụ thể (mỗi manga chỉ lấy 1 lần)
     * @param userId ID của người dùng
     * @param limit Số lượng manga cần lấy
     * @return Danh sách lịch sử đọc gần đây
     */
    @GetMapping("/users/{userId}/recent")
    public ResponseEntity<ApiResponse<List<ReadingHistoryResponse>>> getUserRecentReadingHistory(
            @PathVariable String userId,
            @RequestParam(defaultValue = "3") int limit
    ) {
        log.info("Getting recent reading history for user {}, limit: {}", userId, limit);

        List<ReadingHistoryResponse> recentHistory = readingHistoryService.getRecentReadingHistory(userId, limit);

        return ResponseEntity.ok(ApiResponse.<List<ReadingHistoryResponse>>builder()
                .code(1000)
                .message("Recent reading history retrieved successfully")
                .result(recentHistory)
                .build());
    }

    /**
     * Lấy tất cả mangaId đã đọc của người dùng
     * @param userId ID của người dùng
     * @return Danh sách tất cả mangaId đã đọc
     */
    @GetMapping("/users/{userId}/all-read-manga-ids")
    public ResponseEntity<ApiResponse<List<String>>> getAllReadMangaIds(
            @PathVariable String userId
    ) {
        log.info("Getting all read manga IDs for user {}", userId);

        List<String> allReadMangaIds = readingHistoryService.getAllReadMangaIds(userId);

        return ResponseEntity.ok(ApiResponse.<List<String>>builder()
                .code(1000)
                .message("All read manga IDs retrieved successfully")
                .result(allReadMangaIds)
                .build());
    }
}
