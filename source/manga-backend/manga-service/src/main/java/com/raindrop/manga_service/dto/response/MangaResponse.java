package com.raindrop.manga_service.dto.response;

import com.raindrop.manga_service.enums.MangaStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MangaResponse {
    String id;
    String title;
    String author;
    int loves;
    int views;
    int comments;
    String coverUrl;
    String description;
    List<String> genres;
    int yearOfRelease;
    MangaStatus status;
    String lastChapterId;
    LocalDateTime lastChapterAddedAt;
}
