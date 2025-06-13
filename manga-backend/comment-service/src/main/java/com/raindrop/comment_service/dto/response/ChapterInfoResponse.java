package com.raindrop.comment_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChapterInfoResponse {
    String id;
    String chapterNumber;
    String title;
    String mangaId;
    String mangaTitle;
}
