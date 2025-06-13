package com.raindrop.manga_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HistoryResponse {
    String id;
    String userId;
    String mangaId;
    String chapterId;
    String mangaTitle;
    double chapterNumber;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // Thông tin bổ sung từ Manga Service
    String mangaCoverUrl;
    String chapterTitle;
    String author;
}
