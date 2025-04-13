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
    LocalDateTime lastChapterAddedAt;
    Integer lastChapterNumber;
}
