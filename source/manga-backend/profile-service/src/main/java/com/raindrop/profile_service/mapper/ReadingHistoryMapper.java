package com.raindrop.profile_service.mapper;

import com.raindrop.profile_service.dto.request.ReadingHistoryRequest;
import com.raindrop.profile_service.dto.response.ReadingHistoryResponse;
import com.raindrop.profile_service.entity.ReadingHistory;
import com.raindrop.profile_service.entity.UserProfile;
import org.springframework.stereotype.Component;

@Component
public class ReadingHistoryMapper {

    public ReadingHistory toReadingHistory(ReadingHistoryRequest request, UserProfile userProfile) {
        return ReadingHistory.builder()
                .userProfile(userProfile)
                .mangaId(request.getMangaId())
                .chapterId(request.getChapterId())
                .build();
    }

    public ReadingHistoryResponse toReadingHistoryResponse(ReadingHistory readingHistory) {
        return ReadingHistoryResponse.builder()
                .id(readingHistory.getId())
                .userId(readingHistory.getUserProfile().getUserId())
                .mangaId(readingHistory.getMangaId())
                .chapterId(readingHistory.getChapterId())
                .createdAt(readingHistory.getCreatedAt())
                .updatedAt(readingHistory.getUpdatedAt())
                .build();
    }
}
