package com.raindrop.manga_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Map;

/**
 * Response chứa thông tin thống kê về truyện
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MangaStatisticsResponse {
    // Tổng số truyện (bao gồm cả đã xóa và chưa xóa)
    Long totalMangas;
    
    // Số truyện chưa bị xóa
    Long activeMangas;
    
    // Số truyện đã bị xóa
    Long deletedMangas;
    
    // Số truyện mới thêm trong ngày hôm nay
    Long newMangasToday;
    
    // Số truyện theo thể loại
    Map<String, Long> mangasByGenre;
    
    // Số truyện theo trạng thái
    Map<String, Long> mangasByStatus;
}
