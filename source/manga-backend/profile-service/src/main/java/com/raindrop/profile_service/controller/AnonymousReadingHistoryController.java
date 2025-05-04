package com.raindrop.profile_service.controller;

import com.raindrop.profile_service.dto.request.AnonymousReadingHistoryRequest;
import com.raindrop.profile_service.dto.response.AnonymousReadingHistoryResponse;
import com.raindrop.profile_service.dto.response.ApiResponse;
import com.raindrop.profile_service.service.AnonymousReadingHistoryService;
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
@RequestMapping("/anonymous-reading-history")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AnonymousReadingHistoryController {
    AnonymousReadingHistoryService anonymousReadingHistoryService;
    
    /**
     * Đánh dấu đã đọc chapter cho người dùng không đăng nhập
     * @param request Thông tin chapter đã đọc
     * @param httpRequest Thông tin HTTP request để lấy IP và User-Agent
     * @return Thông tin lịch sử đọc
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AnonymousReadingHistoryResponse>> markChapterAsRead(
            @RequestBody @Valid AnonymousReadingHistoryRequest request,
            HttpServletRequest httpRequest
    ) {
        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        
        log.info("Marking chapter {} of manga {} as read for anonymous user with session {}", 
                request.getChapterId(), request.getMangaId(), request.getSessionId());
        
        AnonymousReadingHistoryResponse response = anonymousReadingHistoryService.markChapterAsRead(request, ipAddress, userAgent);
        
        return ResponseEntity.ok(ApiResponse.<AnonymousReadingHistoryResponse>builder()
                .code(1000)
                .message("Chapter marked as read successfully for anonymous user")
                .result(response)
                .build());
    }
    
    /**
     * Lấy lịch sử đọc của người dùng không đăng nhập
     * @param sessionId ID phiên của người dùng
     * @param pageable Thông tin phân trang
     * @return Danh sách lịch sử đọc có phân trang
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<ApiResponse<Page<AnonymousReadingHistoryResponse>>> getReadingHistory(
            @PathVariable String sessionId,
            @PageableDefault(size = 10, sort = "updatedAt") Pageable pageable
    ) {
        log.info("Getting reading history for anonymous user with session {}", sessionId);
        
        Page<AnonymousReadingHistoryResponse> readingHistory = anonymousReadingHistoryService.getReadingHistory(sessionId, pageable);
        
        return ResponseEntity.ok(ApiResponse.<Page<AnonymousReadingHistoryResponse>>builder()
                .code(1000)
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build());
    }
    
    /**
     * Lấy lịch sử đọc của một manga cụ thể cho người dùng không đăng nhập
     * @param sessionId ID phiên của người dùng
     * @param mangaId ID của manga
     * @return Thông tin lịch sử đọc
     */
    @GetMapping("/session/{sessionId}/manga/{mangaId}")
    public ResponseEntity<ApiResponse<AnonymousReadingHistoryResponse>> getMangaReadingHistory(
            @PathVariable String sessionId,
            @PathVariable String mangaId
    ) {
        log.info("Getting reading history for manga {} and anonymous user with session {}", mangaId, sessionId);
        
        AnonymousReadingHistoryResponse readingHistory = anonymousReadingHistoryService.getMangaReadingHistory(sessionId, mangaId);
        
        return ResponseEntity.ok(ApiResponse.<AnonymousReadingHistoryResponse>builder()
                .code(1000)
                .message("Reading history retrieved successfully")
                .result(readingHistory)
                .build());
    }
}
