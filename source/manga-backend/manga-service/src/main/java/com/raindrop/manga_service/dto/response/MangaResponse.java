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
    String anotherTitle;
    String author;
    int loves;
    int views;
    String description;
    List<String> genres;
    List<String> chapters;
    LocalDateTime updatedAt;
    LocalDateTime lastChapterAddedAt;
}
