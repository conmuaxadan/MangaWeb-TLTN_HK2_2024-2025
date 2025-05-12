package com.raindrop.history_service.mapper;

import com.raindrop.history_service.dto.request.ReadingHistoryRequest;
import com.raindrop.history_service.dto.response.ReadingHistoryResponse;
import com.raindrop.history_service.entity.ReadingHistory;
import org.springframework.stereotype.Component;

@Component
public class ReadingHistoryMapper {

    public ReadingHistory toReadingHistory(ReadingHistoryRequest request, String userId) {
        return ReadingHistory.builder()
                .userId(userId)
                .mangaId(request.getMangaId())
                .chapterId(request.getChapterId())
                .build();
    }

    public ReadingHistoryResponse toReadingHistoryResponse(ReadingHistory readingHistory) {
        return ReadingHistoryResponse.builder()
                .id(readingHistory.getId())
                .userId(readingHistory.getUserId())
                .mangaId(readingHistory.getMangaId())
                .chapterId(readingHistory.getChapterId())
                .createdAt(readingHistory.getCreatedAt())
                .updatedAt(readingHistory.getUpdatedAt())
                .build();
    }
}
