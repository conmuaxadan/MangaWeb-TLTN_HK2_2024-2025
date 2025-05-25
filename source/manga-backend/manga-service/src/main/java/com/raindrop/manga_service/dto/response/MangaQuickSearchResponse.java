package com.raindrop.manga_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * DTO đơn giản để trả về kết quả tìm kiếm nhanh truyện khi thêm chapter
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MangaQuickSearchResponse {
    String id;
    String title;
    String author;
    String coverUrl;
    double highestChapterNumber;
    int chapterCount;
}
