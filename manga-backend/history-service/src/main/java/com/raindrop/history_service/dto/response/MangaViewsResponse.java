package com.raindrop.history_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Response chứa thông tin lượt xem của một truyện
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MangaViewsResponse {
    // ID của truyện
    String mangaId;
    
    // Tiêu đề truyện
    String title;
    
    // Tổng số lượt xem
    Long totalViews;
    
    // Số lượt xem của người dùng đã đăng nhập
    Long registeredUserViews;
    
    // Số lượt xem của người dùng không đăng nhập
    Long anonymousViews;
}
