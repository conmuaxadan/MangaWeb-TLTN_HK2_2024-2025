package com.raindrop.manga_service.dto.response;

import com.raindrop.manga_service.entity.Page;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChapterResponse {
    String id;
    int chapterNumber;
    String title;
    int views;
    int comments;
    List<PageResponse> pages;
    String mangaId;
    LocalDateTime updatedAt;
}
