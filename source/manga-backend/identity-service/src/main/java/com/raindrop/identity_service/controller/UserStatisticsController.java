package com.raindrop.identity_service.controller;

import com.raindrop.identity_service.dto.response.ApiResponse;
import com.raindrop.identity_service.dto.response.UserStatisticsResponse;
import com.raindrop.identity_service.service.UserStatisticsService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xử lý các yêu cầu thống kê người dùng
 */
@RestController
@RequestMapping("/users/statistics")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserStatisticsController {
    
    UserStatisticsService userStatisticsService;
    
    /**
     * Lấy thống kê tổng hợp về người dùng
     * @return Thống kê tổng hợp về người dùng
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<UserStatisticsResponse> getUserStatistics() {
        log.info("Getting user statistics");
        return ApiResponse.<UserStatisticsResponse>builder()
                .code(1000)
                .message("User statistics retrieved successfully")
                .result(userStatisticsService.getUserStatistics())
                .build();
    }
    
    /**
     * Lấy tổng số người dùng
     * @return Tổng số người dùng
     */
    @GetMapping("/total")
    public ApiResponse<Long> getTotalUsers() {
        log.info("Getting total users");
        return ApiResponse.<Long>builder()
                .code(1000)
                .message("Total users retrieved successfully")
                .result(userStatisticsService.getUserStatistics().getTotalUsers())
                .build();
    }
    
    /**
     * Lấy số người dùng mới trong ngày
     * @return Số người dùng mới trong ngày
     */
    @GetMapping("/today")
    public ApiResponse<Long> getNewUsersToday() {
        log.info("Getting new users today");
        return ApiResponse.<Long>builder()
                .code(1000)
                .message("New users today retrieved successfully")
                .result(userStatisticsService.getUserStatistics().getNewUsersToday())
                .build();
    }
}
