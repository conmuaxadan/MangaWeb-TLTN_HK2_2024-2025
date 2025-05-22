package com.raindrop.history_service.mapper;

import com.raindrop.history_service.dto.request.AnonymousHistoryRequest;
import com.raindrop.history_service.dto.response.AnonymousHistoryResponse;
import com.raindrop.history_service.entity.AnonymousHistory;
import org.springframework.stereotype.Component;

@Component
public class AnonymousHistoryMapper {

    public AnonymousHistory toAnonymousReadingHistory(AnonymousHistoryRequest request, String ipAddress) {
        return AnonymousHistory.builder()
                .sessionId(request.getSessionId())
                .mangaId(request.getMangaId())
                .chapterId(request.getChapterId())
                .ipAddress(ipAddress)
                .build();
    }

    public AnonymousHistoryResponse toAnonymousReadingHistoryResponse(AnonymousHistory readingHistory) {
        return AnonymousHistoryResponse.builder()
                .id(readingHistory.getId())
                .sessionId(readingHistory.getSessionId())
                .mangaId(readingHistory.getMangaId())
                .chapterId(readingHistory.getChapterId())
                .createdAt(readingHistory.getCreatedAt())
                .updatedAt(readingHistory.getUpdatedAt())
                .build();
    }
}
