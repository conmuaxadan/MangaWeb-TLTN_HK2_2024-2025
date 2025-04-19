package com.raindrop.manga_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MangaSummaryResponse {
    String id;
    String title;
    String coverUrl;
    String lastChapterId;
    LocalDateTime lastChapterAddedAt;
    String status;
    int views;
    int loves;
    int comments;
    Integer lastChapterNumber;
}
