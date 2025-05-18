package com.raindrop.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChapterNotificationEvent {
    private String mangaId;
    private String mangaTitle;
    private String chapterId;
    private double chapterNumber;
    private String chapterTitle;
    private String userEmail;
}
