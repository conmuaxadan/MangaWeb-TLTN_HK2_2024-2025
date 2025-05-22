package com.raindrop.identity_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO chứa thông tin thống kê về người dùng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatisticsResponse {
    /**
     * Tổng số người dùng
     */
    private Long totalUsers;
    
    /**
     * Số người dùng mới trong ngày
     */
    private Long newUsersToday;
    
    /**
     * Số người dùng mới trong tuần
     */
    private Long newUsersThisWeek;
    
    /**
     * Số người dùng mới trong tháng
     */
    private Long newUsersThisMonth;
    
    /**
     * Số người dùng theo phương thức đăng nhập
     * Key: Tên phương thức đăng nhập (LOCAL, GOOGLE, ...)
     * Value: Số lượng người dùng
     */
    private Map<String, Long> usersByAuthProvider;
    
    /**
     * Số người dùng mới theo ngày
     * Key: Ngày (định dạng yyyy-MM-dd)
     * Value: Số lượng người dùng mới
     */
    private Map<String, Long> usersByDay;
}
