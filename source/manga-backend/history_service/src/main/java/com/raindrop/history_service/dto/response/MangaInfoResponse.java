package com.raindrop.history_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MangaInfoResponse {
    String title;
    String coverUrl;
    String author;
}
