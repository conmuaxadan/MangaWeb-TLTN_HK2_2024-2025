package com.raindrop.manga_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChapterResponse {
    int chapterNumber;
    String title;
    String content;
    String mangaId;
    LocalDateTime updatedAt;
}
