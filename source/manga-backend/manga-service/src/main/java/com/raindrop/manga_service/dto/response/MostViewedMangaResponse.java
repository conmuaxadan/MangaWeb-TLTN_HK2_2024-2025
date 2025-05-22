package com.raindrop.manga_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Response chứa thông tin về truyện được xem nhiều nhất
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MostViewedMangaResponse {
    // ID của truyện
    String id;
    
    // Tiêu đề của truyện
    String title;
    
    // Tổng số lượt xem
    Integer views;
    
    // Tác giả của truyện
    String author;
    
    // Thể loại chính của truyện
    String mainGenre;
}
