package com.raindrop.profile_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FavoriteResponse {
    String id;
    String profileId;
    String userId; // Thông tin từ UserProfile
    String username; // Thông tin từ UserProfile
    String mangaId;
    String mangaTitle;
    String mangaCoverUrl;
    LocalDateTime addedAt;

    // Thông tin bổ sung từ Manga Service
    String author;
    String description;
}
