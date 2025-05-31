package com.raindrop.history_service.service;

import com.raindrop.history_service.dto.response.MangaViewsResponse;
import com.raindrop.history_service.dto.response.ViewStatisticsResponse;
import com.raindrop.history_service.dto.response.ViewsByDayResponse;
import com.raindrop.history_service.repository.AnonymousHistoryRepository;
import com.raindrop.history_service.repository.HistoryRepository;
import com.raindrop.history_service.repository.httpclient.MangaClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StatisticService {
    HistoryRepository historyRepository;
    AnonymousHistoryRepository anonymousHistoryRepository;
    MangaClient mangaClient;

    /**
     * Lấy thống kê tổng hợp về lượt xem
     *
     * @return Thống kê tổng hợp về lượt xem
     */
    public ViewStatisticsResponse getViewStatistics() {
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

        return ViewStatisticsResponse.builder()
                .totalViews(totalViews)
                .todayViews(todayViews)
                .distinctSessions(distinctSessions)
                .distinctUsers(distinctUsers)
                .registeredUserViews(registeredUserViews)
                .anonymousViews(anonymousViews)
                .build();
    }

    /**
     * Lấy số lượt xem theo loại thống kê
     *
     * @param type Loại thống kê: "total", "today", "week", "month"
     * @return Số lượt xem theo loại thống kê
     */
    public Long getViewsByType(String type) {
        return switch (type) {
            case "total" -> {
                // Đếm lượt xem của người dùng đã đăng nhập
                Long registeredUserViews = historyRepository.countTotalViews();
                // Đếm lượt xem của người dùng không đăng nhập
                Long anonymousViews = anonymousHistoryRepository.countTotalViews();
                yield registeredUserViews + anonymousViews;
            }
            case "today" -> {
                // Đếm lượt xem của người dùng đã đăng nhập
                Long registeredUserTodayViews = historyRepository.countTodayViews();
                // Đếm lượt xem của người dùng không đăng nhập
                Long anonymousTodayViews = anonymousHistoryRepository.countTodayViews();
                yield registeredUserTodayViews + anonymousTodayViews;
            }
            case "week" -> countThisWeekViews();
            case "month" -> countThisMonthViews();
            default -> throw new IllegalArgumentException("Invalid view type: " + type);
        };
    }

    /**
     * Lấy thống kê lượt xem theo truyện
     *
     * @param days  Số ngày cần lấy (0 = toàn thời gian)
     * @param limit Số lượng truyện cần lấy
     * @return Danh sách thống kê lượt xem theo truyện
     */
    public List<MangaViewsResponse> getViewsByManga(int days, int limit) {
        return days > 0
                ? getViewsByMangaInPeriod(days, limit)
                : getViewsByManga(limit);
    }

    /**
     * Lấy thống kê lượt xem theo truyện trong khoảng thời gian
     *
     * @param days  Số ngày cần lấy (7, 30, 90)
     * @param limit Số lượng truyện cần lấy (mặc định là 10)
     * @return Danh sách thống kê lượt xem theo truyện
     */
    private List<MangaViewsResponse> getViewsByMangaInPeriod(int days, int limit) {
        // Tính toán ngày bắt đầu và ngày kết thúc
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1); // -1 vì bao gồm cả ngày hiện tại

        // Lấy danh sách truyện có lượt xem nhiều nhất trong khoảng thời gian
        List<Object[]> registeredUserViews = historyRepository.countViewsByMangaBetween(startDate, endDate);
        List<Object[]> anonymousViews = anonymousHistoryRepository.countViewsByMangaBetween(startDate, endDate);

        return processViewsByManga(registeredUserViews, anonymousViews, limit);
    }

    /**
     * Lấy thống kê lượt xem theo truyện (toàn thời gian)
     *
     * @param limit Số lượng truyện cần lấy (mặc định là 10)
     * @return Danh sách thống kê lượt xem theo truyện
     */
    private List<MangaViewsResponse> getViewsByManga(int limit) {
        // Lấy danh sách truyện có lượt xem nhiều nhất (tổng hợp cả 2 loại người dùng)
        List<Object[]> registeredUserViews = historyRepository.countViewsByManga();
        List<Object[]> anonymousViews = anonymousHistoryRepository.countViewsByManga();

        return processViewsByManga(registeredUserViews, anonymousViews, limit);
    }

    /**
     * Xử lý dữ liệu lượt xem theo truyện
     *
     * @param registeredUserViews Lượt xem của người dùng đã đăng nhập
     * @param anonymousViews      Lượt xem của người dùng không đăng nhập
     * @param limit               Số lượng truyện cần lấy
     * @return Danh sách thống kê lượt xem theo truyện
     */
    private List<MangaViewsResponse> processViewsByManga(
            List<Object[]> registeredUserViews,
            List<Object[]> anonymousViews,
            int limit) {

        // Chuyển đổi danh sách thành Map để dễ xử lý
        Map<String, Long> registeredViewsMap = registeredUserViews.stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> ((Number) row[1]).longValue()
                ));

        Map<String, Long> anonymousViewsMap = anonymousViews.stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> ((Number) row[1]).longValue()
                ));

        // Tổng hợp tất cả mangaId
        Set<String> allMangaIds = new HashSet<>();
        allMangaIds.addAll(registeredViewsMap.keySet());
        allMangaIds.addAll(anonymousViewsMap.keySet());

        // Tính tổng lượt xem cho mỗi truyện và sắp xếp
        List<String> topMangaIds = allMangaIds.stream()
                .map(mangaId -> {
                    Long registeredViews = registeredViewsMap.getOrDefault(mangaId, 0L);
                    Long anonymousViewsCount = anonymousViewsMap.getOrDefault(mangaId, 0L);
                    return new AbstractMap.SimpleEntry<>(mangaId, registeredViews + anonymousViewsCount);
                })
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(Map.Entry::getKey)
                .toList();

        // Lấy thông tin chi tiết của truyện từ Manga Service
        return topMangaIds.stream()
                .map(mangaId -> MangaViewsResponse.builder()
                        .mangaId(mangaId)
                        .title(getMangaTitle(mangaId))
                        .totalViews(registeredViewsMap.getOrDefault(mangaId, 0L)
                                + anonymousViewsMap.getOrDefault(mangaId, 0L))
                        .registeredUserViews(registeredViewsMap.getOrDefault(mangaId, 0L))
                        .anonymousViews(anonymousViewsMap.getOrDefault(mangaId, 0L))
                        .build()
                )
                .collect(Collectors.toList());
    }

    /**
     * Lấy tiêu đề truyện từ Manga Service
     *
     * @param mangaId ID của truyện
     * @return Tiêu đề truyện
     */
    private String getMangaTitle(String mangaId) {
        try {
            var mangaResponse = mangaClient.getMangaById(mangaId);
            if (mangaResponse != null && mangaResponse.getResult() != null) {
                return mangaResponse.getResult().getTitle();
            }
        } catch (feign.FeignException.NotFound e) {
            // Xử lý riêng trường hợp truyện không tồn tại (404)
            return "Truyện đã bị xóa #" + mangaId;
        } catch (Exception e) {
            // Xử lý các lỗi khác
        }
        return "Truyện #" + mangaId;
    }

    public List<ViewsByDayResponse> getViewsByDay(int days) {
        // Tính toán ngày bắt đầu và ngày kết thúc
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1); // -1 vì bao gồm cả ngày hiện tại

        // Lấy dữ liệu lượt xem
        List<Object[]> registeredUserViewsByDay = historyRepository.countViewsByDayBetween(startDate, endDate);
        List<Object[]> anonymousViewsByDay = anonymousHistoryRepository.countViewsByDayBetween(startDate, endDate);

        // Chuyển đổi danh sách thành Map để dễ xử lý
        Map<LocalDate, Long> registeredViewsMap = registeredUserViewsByDay.stream()
                .collect(Collectors.toMap(
                        row -> ((java.sql.Date) row[0]).toLocalDate(),
                        row -> ((Number) row[1]).longValue()
                ));

        Map<LocalDate, Long> anonymousViewsMap = anonymousViewsByDay.stream()
                .collect(Collectors.toMap(
                        row -> ((java.sql.Date) row[0]).toLocalDate(),
                        row -> ((Number) row[1]).longValue()
                ));

        // Tạo danh sách tất cả các ngày trong khoảng thời gian và kết quả trả về
        return Stream.iterate(startDate, date -> date.plusDays(1))
                .limit(ChronoUnit.DAYS.between(startDate, endDate) + 1)
                .map(date -> ViewsByDayResponse.builder()
                        .date(date)
                        .views(registeredViewsMap.getOrDefault(date, 0L) + anonymousViewsMap.getOrDefault(date, 0L))
                        .registeredUserViews(registeredViewsMap.getOrDefault(date, 0L))
                        .anonymousViews(anonymousViewsMap.getOrDefault(date, 0L))
                        .build()
                )
                .collect(Collectors.toList());
    }


    private Long countThisWeekViews() {
        Long registeredUserViews = historyRepository.countThisWeekViews();
        Long anonymousViews = anonymousHistoryRepository.countThisWeekViews();
        return registeredUserViews + anonymousViews;
    }

    public Long countThisMonthViews() {
        Long registeredUserViews = historyRepository.countThisMonthViews();
        Long anonymousViews = anonymousHistoryRepository.countThisMonthViews();
        return registeredUserViews + anonymousViews;
    }

    public List<ViewsByDayResponse> getViewsByDateRange(String startDateStr, String endDateStr) {

        try {
            // Parse dates
            LocalDate startDate = LocalDate.parse(startDateStr);
            LocalDate endDate = LocalDate.parse(endDateStr);

            // Validate date range
            if (startDate.isAfter(endDate)) {
                throw new IllegalArgumentException("Start date cannot be after end date");
            }

            // Giới hạn khoảng thời gian tối đa 90 ngày
            long daysBetween = ChronoUnit.DAYS.between(startDate, endDate);
            if (daysBetween > 90) {
                throw new IllegalArgumentException("Date range cannot exceed 90 days");
            }

            // Lấy dữ liệu lượt xem
            List<Object[]> registeredUserViewsByDay = historyRepository.countViewsByDayBetween(startDate, endDate);
            List<Object[]> anonymousViewsByDay = anonymousHistoryRepository.countViewsByDayBetween(startDate, endDate);

            // Chuyển đổi dữ liệu thành Map để dễ truy cập
            Map<LocalDate, Long> registeredViewsMap = registeredUserViewsByDay.stream()
                    .collect(Collectors.toMap(
                            row -> ((java.sql.Date) row[0]).toLocalDate(),
                            row -> ((Number) row[1]).longValue()
                    ));

            Map<LocalDate, Long> anonymousViewsMap = anonymousViewsByDay.stream()
                    .collect(Collectors.toMap(
                            row -> ((java.sql.Date) row[0]).toLocalDate(),
                            row -> ((Number) row[1]).longValue()
                    ));

            // Tạo danh sách tất cả các ngày trong khoảng thời gian và kết quả trả về
            return Stream.iterate(startDate, date -> date.plusDays(1))
                    .limit(ChronoUnit.DAYS.between(startDate, endDate) + 1)
                    .map(date -> ViewsByDayResponse.builder()
                            .date(date)
                            .views(registeredViewsMap.getOrDefault(date, 0L) + anonymousViewsMap.getOrDefault(date, 0L))
                            .registeredUserViews(registeredViewsMap.getOrDefault(date, 0L))
                            .anonymousViews(anonymousViewsMap.getOrDefault(date, 0L))
                            .build())
                    .collect(Collectors.toList());

        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public List<MangaViewsResponse> getViewsByMangaDateRange(String startDateStr, String endDateStr, int limit) {

        try {
            // Parse dates
            LocalDate startDate = LocalDate.parse(startDateStr);
            LocalDate endDate = LocalDate.parse(endDateStr);


            // Lấy dữ liệu lượt xem theo truyện từ người dùng đã đăng nhập
            List<Object[]> registeredUserViewsByManga = historyRepository.countViewsByMangaBetween(startDate, endDate);
            List<Object[]> anonymousViewsByManga = anonymousHistoryRepository.countViewsByMangaBetween(startDate, endDate);

            // Chuyển đổi dữ liệu thành Map để dễ truy cập
            Map<String, Long> registeredViewsMap = registeredUserViewsByManga.stream()
                    .collect(Collectors.toMap(
                            row -> (String) row[0], // mangaId
                            row -> ((Number) row[1]).longValue() // views
                    ));

            Map<String, Long> anonymousViewsMap = anonymousViewsByManga.stream()
                    .collect(Collectors.toMap(
                            row -> (String) row[0], // mangaId
                            row -> ((Number) row[1]).longValue() // views
                    ));

            // Lấy tất cả mangaId unique
            Set<String> allMangaIds = new HashSet<>();
            allMangaIds.addAll(registeredViewsMap.keySet());
            allMangaIds.addAll(anonymousViewsMap.keySet());

            // Tạo kết quả và sắp xếp theo tổng lượt xem
            return allMangaIds.stream()
                    .map(mangaId -> {
                        long registeredViews = registeredViewsMap.getOrDefault(mangaId, 0L);
                        long anonymousViews = anonymousViewsMap.getOrDefault(mangaId, 0L);
                        long totalViews = registeredViews + anonymousViews;

                        return MangaViewsResponse.builder()
                                .mangaId(mangaId)
                                .title(getMangaTitle(mangaId))
                                .totalViews(totalViews)
                                .registeredUserViews(registeredViews)
                                .anonymousViews(anonymousViews)
                                .build();
                    })
                    .sorted((a, b) -> Long.compare(b.getTotalViews(), a.getTotalViews()))
                    .limit(limit)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

}
