package com.raindrop.manga_service.dto.response;

import com.raindrop.manga_service.enums.MangaStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MangaManagementResponse {
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
    double lastChapterNumber;
    LocalDateTime lastChapterAddedAt;
    int chapters;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // Thông tin xóa mềm
    boolean deleted;
    LocalDateTime deletedAt;
    String deletedBy;
}
