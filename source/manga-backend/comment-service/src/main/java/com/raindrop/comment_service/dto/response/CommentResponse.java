package com.raindrop.comment_service.dto.response;

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
    String displayName; // Đây là displayName của người dùng
    String chapterId;
    String mangaId;
    String content;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // Thông tin bổ sung
    String userAvatarUrl;
    Boolean userEnabled; // Trạng thái tài khoản của người dùng

    // Thông tin về manga và chapter
    String mangaTitle;
    String chapterTitle;
    String chapterNumber; // Thêm trường chapterNumber để hiển thị số chương
}
