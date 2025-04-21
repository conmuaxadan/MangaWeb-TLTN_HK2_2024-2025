package com.raindrop.manga_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingHistoryResponse {
    private String id;
    private String userId;
    private String mangaId;
    private String chapterId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String mangaTitle;
    private String mangaCoverUrl;
    private String chapterTitle;
    private int chapterNumber;
}
