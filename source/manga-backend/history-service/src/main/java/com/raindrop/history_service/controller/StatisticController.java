package com.raindrop.history_service.controller;

import com.raindrop.history_service.dto.response.ApiResponse;
import com.raindrop.history_service.dto.response.MangaViewsResponse;
import com.raindrop.history_service.dto.response.ViewStatisticsResponse;
import com.raindrop.history_service.dto.response.ViewsByDayResponse;
import com.raindrop.history_service.repository.AnonymousHistoryRepository;
import com.raindrop.history_service.repository.HistoryRepository;
import com.raindrop.history_service.service.HistoryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller xử lý các API liên quan đến thống kê lượt xem
 */
@RestController
@RequestMapping("/statistics")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class StatisticController {
    HistoryRepository historyRepository;
    AnonymousHistoryRepository anonymousHistoryRepository;
    HistoryService historyService;

    /**
     * Lấy thống kê tổng hợp về lượt xem
     * @return Thống kê tổng hợp về lượt xem
     */
    @GetMapping
    public ApiResponse<ViewStatisticsResponse> getViewStatistics() {
        log.info("Getting view statistics");

        // Đếm lượt xem của người dùng đã đăng nhập
        Long registeredUserViews = historyRepository.countTotalViews();
        Long registeredUserTodayViews = historyRepository.countTodayViews();
        Long distinctUsers = historyRepository.countDistinctUsers();

        // Đếm lượt xem của người dùng không đăng nhập
        Long anonymousViews = anonymousHistoryRepository.countTotalViews();
        Long anonymousTodayViews = anonymousHistoryRepository.countTodayViews();
        Long distinctSessions = anonymousHistoryRepository.countDistinctSessions();

        // Tổng hợp thống kê
        Long totalViews = registeredUserViews + anonymousViews;
        Long todayViews = registeredUserTodayViews + anonymousTodayViews;

        ViewStatisticsResponse response = ViewStatisticsResponse.builder()
                .totalViews(totalViews)
                .todayViews(todayViews)
                .distinctSessions(distinctSessions)
                .distinctUsers(distinctUsers)
                .registeredUserViews(registeredUserViews)
                .anonymousViews(anonymousViews)
                .build();

        return ApiResponse.<ViewStatisticsResponse>builder()
                .code(1000)
                .message("View statistics retrieved successfully")
                .result(response)
                .build();
    }

    /**
     * Lấy tổng số lượt xem
     * @return Tổng số lượt xem
     */
    @GetMapping("/total")
    public ApiResponse<Long> getTotalViews() {
        log.info("Getting total views");

        // Đếm lượt xem của người dùng đã đăng nhập
        Long registeredUserViews = historyRepository.countTotalViews();

        // Đếm lượt xem của người dùng không đăng nhập
        Long anonymousViews = anonymousHistoryRepository.countTotalViews();

        // Tổng hợp thống kê
        Long totalViews = registeredUserViews + anonymousViews;

        return ApiResponse.<Long>builder()
                .code(1000)
                .message("Total views retrieved successfully")
                .result(totalViews)
                .build();
    }

    /**
     * Lấy số lượt xem trong ngày hôm nay
     * @return Số lượt xem trong ngày hôm nay
     */
    @GetMapping("/today")
    public ApiResponse<Long> getTodayViews() {
        log.info("Getting today views");

        // Đếm lượt xem của người dùng đã đăng nhập
        Long registeredUserTodayViews = historyRepository.countTodayViews();

        // Đếm lượt xem của người dùng không đăng nhập
        Long anonymousTodayViews = anonymousHistoryRepository.countTodayViews();

        // Tổng hợp thống kê
        Long todayViews = registeredUserTodayViews + anonymousTodayViews;

        return ApiResponse.<Long>builder()
                .code(1000)
                .message("Today views retrieved successfully")
                .result(todayViews)
                .build();
    }

    /**
     * Lấy số lượt xem trong tuần này
     * @return Số lượt xem trong tuần này
     */
    @GetMapping("/this-week")
    public ApiResponse<Long> getThisWeekViews() {
        log.info("Getting this week views");

        Long thisWeekViews = historyService.countThisWeekViews();

        return ApiResponse.<Long>builder()
                .code(1000)
                .message("This week views retrieved successfully")
                .result(thisWeekViews)
                .build();
    }

    /**
     * Lấy số lượt xem trong tháng này
     * @return Số lượt xem trong tháng này
     */
    @GetMapping("/this-month")
    public ApiResponse<Long> getThisMonthViews() {
        log.info("Getting this month views");

        Long thisMonthViews = historyService.countThisMonthViews();

        return ApiResponse.<Long>builder()
                .code(1000)
                .message("This month views retrieved successfully")
                .result(thisMonthViews)
                .build();
    }

    /**
     * Lấy thống kê lượt xem theo ngày trong khoảng thời gian
     * @param days Số ngày cần lấy (mặc định là 7)
     * @return Danh sách thống kê lượt xem theo ngày
     */
    @GetMapping("/by-day")
    public ApiResponse<List<ViewsByDayResponse>> getViewsByDay(
            @RequestParam(defaultValue = "7") int days
    ) {
        log.info("Getting views by day for the last {} days", days);

        // Giới hạn số ngày tối đa là 90
        if (days > 90) {
            days = 90;
        }

        List<ViewsByDayResponse> viewsByDay = historyService.getViewsByDay(days);

        return ApiResponse.<List<ViewsByDayResponse>>builder()
                .code(1000)
                .message("Views by day retrieved successfully")
                .result(viewsByDay)
                .build();
    }

    /**
     * Lấy thống kê lượt xem theo truyện
     * @param days Số ngày cần lấy (mặc định là 0, lấy tất cả)
     * @param limit Số lượng truyện cần lấy (mặc định là 10)
     * @return Danh sách thống kê lượt xem theo truyện
     */
    @GetMapping("/by-manga")
    public ApiResponse<List<MangaViewsResponse>> getViewsByManga(
            @RequestParam(defaultValue = "0") int days,
            @RequestParam(defaultValue = "10") int limit
    ) {
        log.info("Getting views by manga, days: {}, limit: {}", days, limit);

        // Giới hạn số lượng truyện tối đa là 50
        if (limit > 50) {
            limit = 50;
        }

        List<MangaViewsResponse> viewsByManga;

        // Nếu days > 0, lấy dữ liệu trong khoảng thời gian
        if (days > 0) {
            viewsByManga = historyService.getViewsByMangaInPeriod(days, limit);
        } else {
            // Nếu days = 0, lấy tất cả dữ liệu
            viewsByManga = historyService.getViewsByManga(limit);
        }

        return ApiResponse.<List<MangaViewsResponse>>builder()
                .code(1000)
                .message("Views by manga retrieved successfully")
                .result(viewsByManga)
                .build();
    }
}
