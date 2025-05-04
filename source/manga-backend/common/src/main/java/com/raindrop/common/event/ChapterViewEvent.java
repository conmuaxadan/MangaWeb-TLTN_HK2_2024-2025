package com.raindrop.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Event được gửi khi người dùng xem một chapter
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ChapterViewEvent {
    String chapterId;
    String mangaId;
    String userId; // Có thể null nếu người dùng không đăng nhập
}
