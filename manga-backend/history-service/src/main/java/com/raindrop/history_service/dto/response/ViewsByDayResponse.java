package com.raindrop.history_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

/**
 * Response chứa thông tin lượt xem theo ngày
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ViewsByDayResponse {
    // Ngày
    LocalDate date;
    
    // Tổng số lượt xem trong ngày
    Long views;
    
    // Số lượt xem của người dùng đã đăng nhập
    Long registeredUserViews;
    
    // Số lượt xem của người dùng không đăng nhập
    Long anonymousViews;
}
