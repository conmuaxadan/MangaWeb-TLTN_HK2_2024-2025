package com.raindrop.history_service.mapper;

import com.raindrop.history_service.dto.request.HistoryRequest;
import com.raindrop.history_service.dto.response.HistoryResponse;
import com.raindrop.history_service.entity.History;
import org.springframework.stereotype.Component;

@Component
public class HistoryMapper {

    public History toReadingHistory(HistoryRequest request, String userId) {
        return History.builder()
                .userId(userId)
                .mangaId(request.getMangaId())
                .chapterId(request.getChapterId())
                .build();
    }

    public HistoryResponse toReadingHistoryResponse(History history) {
        return HistoryResponse.builder()
                .id(history.getId())
                .userId(history.getUserId())
                .mangaId(history.getMangaId())
                .chapterId(history.getChapterId())
                .createdAt(history.getCreatedAt())
                .updatedAt(history.getUpdatedAt())
                .build();
    }
}
