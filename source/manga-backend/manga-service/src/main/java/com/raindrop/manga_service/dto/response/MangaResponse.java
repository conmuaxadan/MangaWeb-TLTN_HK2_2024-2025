package com.raindrop.manga_service.dto.response;

import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Genre;
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
    String coverUrl;
    String description;
    List<String> genres;
    List<String> chapters;
    Integer yearOfRelease;
    String status;
    LocalDateTime updatedAt;
    LocalDateTime lastChapterAddedAt;
}
