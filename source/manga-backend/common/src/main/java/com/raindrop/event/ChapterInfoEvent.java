package com.raindrop.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChapterInfoEvent {
    private String chapterId;
    private String mangaId;
    private Integer chapterNumber;
    private String title;
}
