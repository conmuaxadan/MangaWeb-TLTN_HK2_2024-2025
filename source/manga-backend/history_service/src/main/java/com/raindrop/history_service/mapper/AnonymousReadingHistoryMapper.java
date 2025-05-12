package com.raindrop.history_service.mapper;

import com.raindrop.history_service.dto.request.AnonymousReadingHistoryRequest;
import com.raindrop.history_service.dto.response.AnonymousReadingHistoryResponse;
import com.raindrop.history_service.entity.AnonymousReadingHistory;
import org.springframework.stereotype.Component;

@Component
public class AnonymousReadingHistoryMapper {

    public AnonymousReadingHistory toAnonymousReadingHistory(AnonymousReadingHistoryRequest request, String ipAddress, String userAgent) {
        return AnonymousReadingHistory.builder()
                .sessionId(request.getSessionId())
                .mangaId(request.getMangaId())
                .chapterId(request.getChapterId())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
    }

    public AnonymousReadingHistoryResponse toAnonymousReadingHistoryResponse(AnonymousReadingHistory readingHistory) {
        return AnonymousReadingHistoryResponse.builder()
                .id(readingHistory.getId())
                .sessionId(readingHistory.getSessionId())
                .mangaId(readingHistory.getMangaId())
                .chapterId(readingHistory.getChapterId())
                .createdAt(readingHistory.getCreatedAt())
                .updatedAt(readingHistory.getUpdatedAt())
                .build();
    }
}
