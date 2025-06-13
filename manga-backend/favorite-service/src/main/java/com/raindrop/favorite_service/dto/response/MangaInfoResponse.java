package com.raindrop.favorite_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class MangaInfoResponse {
    String id;
    String title;
    String coverUrl;
    String author;
    String description;
    Integer views;
    Integer loves;
    Integer comments;
}
