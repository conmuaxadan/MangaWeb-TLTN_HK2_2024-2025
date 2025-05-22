package com.raindrop.history_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Response chứa thông tin thống kê về lượt xem
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ViewStatisticsResponse {
    // Tổng số lượt xem (cả người dùng đăng nhập và không đăng nhập)
    Long totalViews;
    
    // Số lượt xem trong ngày hôm nay
    Long todayViews;
    
    // Số lượng phiên duy nhất (người dùng không đăng nhập)
    Long distinctSessions;
    
    // Số lượng người dùng duy nhất đã đọc truyện (người dùng đã đăng nhập)
    Long distinctUsers;
    
    // Số lượt xem của người dùng đã đăng nhập
    Long registeredUserViews;
    
    // Số lượt xem của người dùng không đăng nhập
    Long anonymousViews;
}
