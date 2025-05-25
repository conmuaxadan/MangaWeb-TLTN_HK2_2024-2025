package com.raindrop.history_service.controller;

import com.raindrop.history_service.dto.response.ApiResponse;
import com.raindrop.history_service.dto.response.MangaViewsResponse;
import com.raindrop.history_service.dto.response.ViewStatisticsResponse;
import com.raindrop.history_service.dto.response.ViewsByDayResponse;
import com.raindrop.history_service.service.StatisticService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/statistics")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class StatisticController {
    StatisticService statisticService;

    /**
     * Lấy thống kê tổng hợp về lượt xem
     *
     * @return Thống kê tổng hợp về lượt xem
     */
    @GetMapping
    public ApiResponse<ViewStatisticsResponse> getViewStatistics() {
        log.info("Getting view statistics");
        ViewStatisticsResponse response = statisticService.getViewStatistics();

        return ApiResponse.<ViewStatisticsResponse>builder()
                .code(1000)
                .message("View statistics retrieved successfully")
                .result(response)
                .build();
    }

    /**
     * Lấy số lượt xem theo loại thống kê
     *
     * @param type Loại thống kê: total, today, week, month
     * @return Số lượt xem theo loại thống kê
     */
    @GetMapping("/{type}")
    public ApiResponse<Long> getViewsByType(@PathVariable String type) {
        log.info("Getting views by type: {}", type);
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
                .code(1000)
                .message(message)
                .result(views)
                .build();
    }

    /**
     * Lấy thống kê lượt xem theo ngày trong khoảng thời gian
     *
     * @param days      Số ngày cần lấy (mặc định là 7) - deprecated, sử dụng startDate và endDate
     * @param startDate Ngày bắt đầu (format: yyyy-MM-dd)
     * @param endDate   Ngày kết thúc (format: yyyy-MM-dd)
     * @return Danh sách thống kê lượt xem theo ngày
     */
    @GetMapping("/by-day")
    public ApiResponse<List<ViewsByDayResponse>> getViewsByDay(
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        List<ViewsByDayResponse> viewsByDay;

        if (startDate != null && endDate != null) {
            log.info("Getting views by day from {} to {}", startDate, endDate);
            viewsByDay = statisticService.getViewsByDateRange(startDate, endDate);
        } else {
            // Fallback to old logic for backward compatibility
            int daysToUse = days != null ? days : 7;
            log.info("Getting views by day for the last {} days", daysToUse);

            // Giới hạn số ngày tối đa là 90
            if (daysToUse > 90) {
                daysToUse = 90;
            }

            viewsByDay = statisticService.getViewsByDay(daysToUse);
        }

        return ApiResponse.<List<ViewsByDayResponse>>builder()
                .code(1000)
                .message("Views by day retrieved successfully")
                .result(viewsByDay)
                .build();
    }

    /**
     * Lấy thống kê lượt xem theo truyện
     *
     * @param days      Số ngày cần lấy (mặc định là 0, lấy tất cả) - deprecated, sử dụng startDate và endDate
     * @param startDate Ngày bắt đầu (format: yyyy-MM-dd)
     * @param endDate   Ngày kết thúc (format: yyyy-MM-dd)
     * @param limit     Số lượng truyện cần lấy (mặc định là 10)
     * @return Danh sách thống kê lượt xem theo truyện
     */
    @GetMapping("/by-manga")
    public ApiResponse<List<MangaViewsResponse>> getViewsByManga(
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<MangaViewsResponse> viewsByManga;
        log.info("Getting views by manga from {} to {}, limit: {}", startDate, endDate, limit);
        viewsByManga = statisticService.getViewsByMangaDateRange(startDate, endDate, limit);
        return ApiResponse.<List<MangaViewsResponse>>builder()
                .code(1000)
                .message("Views by manga retrieved successfully")
                .result(viewsByManga)
                .build();
    }
}
