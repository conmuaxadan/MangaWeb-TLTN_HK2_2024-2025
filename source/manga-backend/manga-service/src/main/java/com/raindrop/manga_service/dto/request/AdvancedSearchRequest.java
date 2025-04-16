package com.raindrop.manga_service.dto.request;

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
    String status;
    String orderBy;
}
