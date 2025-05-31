package com.raindrop.history_service.controller;

import com.raindrop.history_service.dto.response.ApiResponse;
import com.raindrop.history_service.dto.response.MangaViewsResponse;
import com.raindrop.history_service.dto.response.ViewStatisticsResponse;
import com.raindrop.history_service.dto.response.ViewsByDayResponse;
import com.raindrop.history_service.service.StatisticService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/statistics")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StatisticController {
    StatisticService statisticService;

    @GetMapping
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    public ApiResponse<ViewStatisticsResponse> getViewStatistics() {
        ViewStatisticsResponse response = statisticService.getViewStatistics();

        return ApiResponse.<ViewStatisticsResponse>builder()
                .message("View statistics retrieved successfully")
                .result(response)
                .build();
    }

    @GetMapping("/{type}")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    public ApiResponse<Long> getViewsByType(@PathVariable String type) {
        String message;

        switch (type) {
            case "total" -> message = "Total views retrieved successfully";
            case "today" -> message = "Today views retrieved successfully";
            case "week" -> message = "This week views retrieved successfully";
            case "month" -> message = "This month views retrieved successfully";
            default -> throw new IllegalArgumentException("Invalid view type: " + type);
        }

        Long views = statisticService.getViewsByType(type);

        return ApiResponse.<Long>builder()
                .message(message)
                .result(views)
                .build();
    }

    @GetMapping("/by-day")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    public ApiResponse<List<ViewsByDayResponse>> getViewsByDay(
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        List<ViewsByDayResponse> viewsByDay;

        if (startDate != null && endDate != null) {
            viewsByDay = statisticService.getViewsByDateRange(startDate, endDate);
        } else {
            // Fallback to old logic for backward compatibility
            int daysToUse = days != null ? days : 7;

            // Giới hạn số ngày tối đa là 90
            if (daysToUse > 90) {
                daysToUse = 90;
            }

            viewsByDay = statisticService.getViewsByDay(daysToUse);
        }

        return ApiResponse.<List<ViewsByDayResponse>>builder()
                .message("Views by day retrieved successfully")
                .result(viewsByDay)
                .build();
    }

    @GetMapping("/by-manga")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    public ApiResponse<List<MangaViewsResponse>> getViewsByManga(
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<MangaViewsResponse> viewsByManga;
        viewsByManga = statisticService.getViewsByMangaDateRange(startDate, endDate, limit);
        return ApiResponse.<List<MangaViewsResponse>>builder()
                .message("Views by manga retrieved successfully")
                .result(viewsByManga)
                .build();
    }
}
