package com.raindrop.manga_service.controller;

import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.MangaResponse;
import com.raindrop.manga_service.dto.response.MangaSummaryResponse;
import com.raindrop.manga_service.service.RecommendationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class RecommendationController {
    RecommendationService recommendationService;

    /**
     * Lấy gợi ý manga dựa trên thể loại từ lịch sử đọc
     * @param userId ID của người dùng
     * @param limit Số lượng manga gợi ý (mặc định là 6)
     * @return Danh sách manga được gợi ý
     */
    @GetMapping("/by-genre")
    public ApiResponse<List<MangaSummaryResponse>> getRecommendationsByGenre(
            @RequestParam String userId,
            @RequestParam(required = false) Integer limit
    ) {
        log.info("Getting recommendations by genre for user: {}, limit: {}", userId, limit);
        log.info("Calling recommendationService.getRecommendationsByGenre for user: {}, limit: {}", userId, limit);
        List<MangaSummaryResponse> recommendations = recommendationService.getRecommendationsByGenreSummary(userId, limit);

        if (recommendations.isEmpty()) {
            log.info("No recommendations found for user {}", userId);
            return ApiResponse.<List<MangaSummaryResponse>>builder()
                    .message("No recommendations found")
                    .result(recommendations)
                    .build();
        }
        log.info("Found {} recommendations for user {}", recommendations.size(), userId);
        log.info("Returning {} recommendations for user {}", recommendations.size(), userId);
        return ApiResponse.<List<MangaSummaryResponse>>builder()
                .message("Recommendations retrieved successfully")
                .result(recommendations)
                .build();
    }
}
