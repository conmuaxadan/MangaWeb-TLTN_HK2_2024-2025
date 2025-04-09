package com.raindrop.profile_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReadingHistoryResponse {
    String id;
    String userId;
    String mangaId;
    String chapterId;
    String mangaTitle;
    Integer chapterNumber;
    Integer lastPage;
    LocalDateTime readAt;
    LocalDateTime updatedAt;
    
    // Thông tin bổ sung từ Manga Service
    String mangaCoverUrl;
    String chapterTitle;
}
