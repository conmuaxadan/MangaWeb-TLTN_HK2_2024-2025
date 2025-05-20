package com.raindrop.history_service.controller;

import com.raindrop.history_service.dto.response.ApiResponse;
import com.raindrop.history_service.dto.response.ViewStatisticsResponse;
import com.raindrop.history_service.repository.AnonymousReadingHistoryRepository;
import com.raindrop.history_service.repository.ReadingHistoryRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xử lý các API liên quan đến thống kê lượt xem
 */
@RestController
@RequestMapping("/view-statistics")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ViewStatisticsController {
    ReadingHistoryRepository readingHistoryRepository;
    AnonymousReadingHistoryRepository anonymousReadingHistoryRepository;
    
    /**
     * Lấy thống kê tổng hợp về lượt xem
     * @return Thống kê tổng hợp về lượt xem
     */
    @GetMapping
    public ApiResponse<ViewStatisticsResponse> getViewStatistics() {
        log.info("Getting view statistics");
        
        // Đếm lượt xem của người dùng đã đăng nhập
        Long registeredUserViews = readingHistoryRepository.countTotalViews();
        Long registeredUserTodayViews = readingHistoryRepository.countTodayViews();
        Long distinctUsers = readingHistoryRepository.countDistinctUsers();
        
        // Đếm lượt xem của người dùng không đăng nhập
        Long anonymousViews = anonymousReadingHistoryRepository.countTotalViews();
        Long anonymousTodayViews = anonymousReadingHistoryRepository.countTodayViews();
        Long distinctSessions = anonymousReadingHistoryRepository.countDistinctSessions();
        
        // Tổng hợp thống kê
        Long totalViews = registeredUserViews + anonymousViews;
        Long todayViews = registeredUserTodayViews + anonymousTodayViews;
        
        ViewStatisticsResponse response = ViewStatisticsResponse.builder()
                .totalViews(totalViews)
                .todayViews(todayViews)
                .distinctSessions(distinctSessions)
                .distinctUsers(distinctUsers)
                .registeredUserViews(registeredUserViews)
                .anonymousViews(anonymousViews)
                .build();
        
        return ApiResponse.<ViewStatisticsResponse>builder()
                .code(1000)
                .message("View statistics retrieved successfully")
                .result(response)
                .build();
    }
    
    /**
     * Lấy tổng số lượt xem
     * @return Tổng số lượt xem
     */
    @GetMapping("/total")
    public ApiResponse<Long> getTotalViews() {
        log.info("Getting total views");
        
        // Đếm lượt xem của người dùng đã đăng nhập
        Long registeredUserViews = readingHistoryRepository.countTotalViews();
        
        // Đếm lượt xem của người dùng không đăng nhập
        Long anonymousViews = anonymousReadingHistoryRepository.countTotalViews();
        
        // Tổng hợp thống kê
        Long totalViews = registeredUserViews + anonymousViews;
        
        return ApiResponse.<Long>builder()
                .code(1000)
                .message("Total views retrieved successfully")
                .result(totalViews)
                .build();
    }
    
    /**
     * Lấy số lượt xem trong ngày hôm nay
     * @return Số lượt xem trong ngày hôm nay
     */
    @GetMapping("/today")
    public ApiResponse<Long> getTodayViews() {
        log.info("Getting today views");
        
        // Đếm lượt xem của người dùng đã đăng nhập
        Long registeredUserTodayViews = readingHistoryRepository.countTodayViews();
        
        // Đếm lượt xem của người dùng không đăng nhập
        Long anonymousTodayViews = anonymousReadingHistoryRepository.countTodayViews();
        
        // Tổng hợp thống kê
        Long todayViews = registeredUserTodayViews + anonymousTodayViews;
        
        return ApiResponse.<Long>builder()
                .code(1000)
                .message("Today views retrieved successfully")
                .result(todayViews)
                .build();
    }
}
