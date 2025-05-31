package com.raindrop.manga_service.controller;

import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.MangaSummaryResponse;
import com.raindrop.manga_service.service.RecommendationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class RecommendationController {
    RecommendationService recommendationService;

    @GetMapping("/by-genre")
    public ApiResponse<List<MangaSummaryResponse>> getRecommendationsByGenre(
            @RequestParam String userId,
            @RequestParam(defaultValue = "6") int limit
    ) {
        List<MangaSummaryResponse> recommendations = recommendationService.getRecommendationsByGenreSummary(userId, limit);

        if (recommendations.isEmpty()) {
            return ApiResponse.<List<MangaSummaryResponse>>builder()
                    .message("No recommendations found")
                    .result(recommendations)
                    .build();
        }

        return ApiResponse.<List<MangaSummaryResponse>>builder()
                .message("Recommendations retrieved successfully")
                .result(recommendations)
                .build();
    }
}
