package com.raindrop.profile_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CommentResponse {
    String id;
    String userId;
    String profileId;
    String username;
    String chapterId;
    String mangaId;
    String content;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // Thông tin bổ sung
    String userAvatarUrl;

    // Thông tin về manga và chapter
    String mangaTitle;
    String chapterNumber;
}
