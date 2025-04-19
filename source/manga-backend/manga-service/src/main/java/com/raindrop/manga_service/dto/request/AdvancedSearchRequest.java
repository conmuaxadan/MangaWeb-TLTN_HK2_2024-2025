package com.raindrop.manga_service.dto.request;

import com.raindrop.manga_service.enums.MangaStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdvancedSearchRequest {
    String title;
    String author;
    List<String> genres;
    Integer yearOfRelease;
    MangaStatus status;
    String orderBy;
}
