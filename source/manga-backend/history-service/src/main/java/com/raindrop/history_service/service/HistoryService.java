package com.raindrop.history_service.service;

import com.raindrop.history_service.repository.httpclient.MangaClient;
import com.raindrop.history_service.dto.request.HistoryRequest;
import com.raindrop.history_service.dto.response.MangaViewsResponse;
import com.raindrop.history_service.dto.response.HistoryResponse;
import com.raindrop.history_service.dto.response.ViewStatisticsResponse;
import com.raindrop.history_service.dto.response.ViewsByDayResponse;
import com.raindrop.history_service.entity.History;
import com.raindrop.history_service.kafka.ChapterViewEventProducer;
import com.raindrop.history_service.mapper.HistoryMapper;
import com.raindrop.history_service.repository.AnonymousHistoryRepository;
import com.raindrop.history_service.repository.HistoryRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class HistoryService {
    HistoryRepository historyRepository;
    HistoryMapper historyMapper;
    ChapterViewEventProducer chapterViewEventProducer;
    MangaClient mangaClient;
    AnonymousHistoryRepository anonymousHistoryRepository;

    /**
     * Đánh dấu đã đọc chapter
     * @param userId ID của người dùng
     * @param request Thông tin chapter đã đọc
     * @return Thông tin lịch sử đọc
     */
    @Transactional
    public HistoryResponse markChapterAsRead(String userId, HistoryRequest request) {
        log.info("Marking chapter {} of manga {} as read for user {}",
                request.getChapterId(), request.getMangaId(), userId);

        // Kiểm tra xem đã có lịch sử đọc cho chapter này chưa
        Optional<History> existingHistory = historyRepository
                .findByUserIdAndMangaIdAndChapterId(userId, request.getMangaId(), request.getChapterId());

        History history;
        if (existingHistory.isPresent()) {
            // Sử dụng lịch sử đọc hiện có (chỉ cập nhật thời gian)
            history = existingHistory.get();
        } else {
            // Tạo lịch sử đọc mới
            history = historyMapper.toReadingHistory(request, userId);

            // Gửi sự kiện tăng lượt xem qua Kafka
            chapterViewEventProducer.sendChapterViewEvent(
                    request.getChapterId(),
                    request.getMangaId(),
                    userId
            );
        }
        // Lưu lịch sử đọc
        history = historyRepository.save(history);


        log.info("Sent chapter view event for chapter {} of manga {}",
                request.getChapterId(), request.getMangaId());

        // Tạo response
        HistoryResponse response = historyMapper.toReadingHistoryResponse(history);

        // Bổ sung thông tin từ Manga Service
        try {
            var mangaResponse = mangaClient.getMangaById(request.getMangaId());
            var chapterResponse = mangaClient.getChapterById(request.getChapterId());

            // Xử lý dữ liệu từ response và bổ sung vào response
            if (mangaResponse != null && mangaResponse.getResult() != null) {
                var mangaInfo = mangaResponse.getResult();
                response.setMangaTitle((String) ((Map<String, Object>) mangaInfo).get("title"));
                response.setMangaCoverUrl((String) ((Map<String, Object>) mangaInfo).get("coverUrl"));
                response.setAuthor((String) ((Map<String, Object>) mangaInfo).get("author"));
            }

            if (chapterResponse != null && chapterResponse.getResult() != null) {
                var chapterInfo = chapterResponse.getResult();
                response.setChapterTitle((String) ((Map<String, Object>) chapterInfo).get("title"));
                response.setChapterNumber((Double) ((Map<String, Object>) chapterInfo).get("chapterNumber"));
            }

        } catch (feign.FeignException.NotFound e) {
            // Xử lý riêng trường hợp truyện không tồn tại (404)
            log.warn("Manga not found for ID: {}", request.getMangaId());
            response.setMangaTitle("Truyện đã bị xóa #" + request.getMangaId());
        } catch (Exception e) {
            log.error("Error getting manga/chapter info", e);
        }

        return response;
    }

    /**
     * Lấy lịch sử đọc của người dùng
     * @param userId ID của người dùng
     * @param pageable Thông tin phân trang
     * @return Danh sách lịch sử đọc có phân trang
     */
    public Page<HistoryResponse> getReadingHistory(String userId, Pageable pageable) {
        log.info("Getting reading history for user {}", userId);

        // Lấy lịch sử đọc theo manga (mỗi manga chỉ lấy chapter đọc gần nhất)
        Page<History> readingHistories = historyRepository
                .findLatestByUserIdGroupByManga(userId, pageable);

        return readingHistories.map(history -> {
            HistoryResponse response = historyMapper.toReadingHistoryResponse(history);

            // Bổ sung thông tin từ Manga Service
            try {
                var mangaResponse = mangaClient.getMangaById(history.getMangaId());
                var chapterResponse = mangaClient.getChapterById(history.getChapterId());

                // Xử lý dữ liệu từ response và bổ sung vào response
                if (mangaResponse != null && mangaResponse.getResult() != null) {
                    var mangaInfo = mangaResponse.getResult();
                    response.setMangaTitle(mangaInfo.getTitle());
                    response.setMangaCoverUrl(mangaInfo.getCoverUrl());
                    response.setAuthor(mangaInfo.getAuthor());
                }

                if (chapterResponse != null && chapterResponse.getResult() != null) {
                    var chapterInfo = chapterResponse.getResult();
                    response.setChapterTitle(chapterInfo.getTitle());
                    response.setChapterNumber(chapterInfo.getChapterNumber());
                }

            } catch (feign.FeignException.NotFound e) {
                // Xử lý riêng trường hợp truyện không tồn tại (404)
                log.warn("Manga not found for ID: {}", history.getMangaId());
                response.setMangaTitle("Truyện đã bị xóa #" + history.getMangaId());
            } catch (Exception e) {
                log.error("Error getting manga/chapter info", e);
            }

            return response;
        });
    }

    /**
     * Lấy lịch sử đọc của một manga cụ thể
     * @param userId ID của người dùng
     * @param mangaId ID của manga
     * @return Thông tin lịch sử đọc
     */
    public HistoryResponse getMangaReadingHistory(String userId, String mangaId) {
        log.info("Getting reading history for manga {} and user {}", mangaId, userId);

        // Lấy lịch sử đọc gần nhất của manga
        History history = historyRepository
                .findFirstByUserIdAndMangaIdOrderByUpdatedAtDesc(userId, mangaId)
                .orElseThrow(() -> new RuntimeException("Reading history not found"));

        HistoryResponse response = historyMapper.toReadingHistoryResponse(history);

        // Bổ sung thông tin từ Manga Service
        try {
            var mangaResponse = mangaClient.getMangaById(mangaId);
            var chapterResponse = mangaClient.getChapterById(history.getChapterId());

            // Xử lý dữ liệu từ response và bổ sung vào response
            if (mangaResponse != null && mangaResponse.getResult() != null) {
                var mangaInfo = mangaResponse.getResult();
                response.setMangaTitle(mangaInfo.getTitle());
                response.setMangaCoverUrl(mangaInfo.getCoverUrl());
                response.setAuthor(mangaInfo.getAuthor());
            }

            if (chapterResponse != null && chapterResponse.getResult() != null) {
                var chapterInfo = chapterResponse.getResult();
                response.setChapterTitle(chapterInfo.getTitle());
                response.setChapterNumber(chapterInfo.getChapterNumber());
            }

        } catch (feign.FeignException.NotFound e) {
            // Xử lý riêng trường hợp truyện không tồn tại (404)
            log.warn("Manga not found for ID: {}", mangaId);
            response.setMangaTitle("Truyện đã bị xóa #" + mangaId);
        } catch (Exception e) {
            log.error("Error getting manga/chapter info", e);
        }

        return response;
    }

    /**
     * Lấy lịch sử đọc gần đây của người dùng (mỗi manga chỉ lấy 1 lần)
     * @param userId ID của người dùng
     * @param limit Số lượng manga cần lấy
     * @return Danh sách lịch sử đọc gần đây
     */
    public List<HistoryResponse> getRecentReadingHistory(String userId, int limit) {
        log.info("Getting recent reading history for user {}, limit: {}", userId, limit);

        // Lấy tất cả lịch sử đọc của người dùng, sắp xếp theo thời gian gần nhất
        List<History> allHistory = historyRepository.findByUserIdOrderByUpdatedAtDesc(userId);

        // Lọc để mỗi manga chỉ lấy 1 lần (chapter mới nhất)
        Map<String, History> uniqueMangaMap = new LinkedHashMap<>(); // Sử dụng LinkedHashMap để giữ thứ tự

        for (History history : allHistory) {
            String mangaId = history.getMangaId();
            if (!uniqueMangaMap.containsKey(mangaId)) {
                uniqueMangaMap.put(mangaId, history);

                // Nếu đã đủ số lượng manga cần lấy, dừng vòng lặp
                if (uniqueMangaMap.size() >= limit) {
                    break;
                }
            }
        }

        // Chuyển đổi kết quả sang DTO và bổ sung thông tin
        List<HistoryResponse> result = new ArrayList<>();
        for (History history : uniqueMangaMap.values()) {
            HistoryResponse response = historyMapper.toReadingHistoryResponse(history);

            // Bổ sung thông tin từ Manga Service
            try {
                var mangaResponse = mangaClient.getMangaById(history.getMangaId());
                var chapterResponse = mangaClient.getChapterById(history.getChapterId());

                // Xử lý dữ liệu từ response và bổ sung vào response
                if (mangaResponse != null && mangaResponse.getResult() != null) {
                    var mangaInfo = mangaResponse.getResult();
                    response.setMangaTitle(mangaInfo.getTitle());
                    response.setMangaCoverUrl(mangaInfo.getCoverUrl());
                    response.setAuthor(mangaInfo.getAuthor());
                }

                if (chapterResponse != null && chapterResponse.getResult() != null) {
                    var chapterInfo = chapterResponse.getResult();
                    response.setChapterTitle(chapterInfo.getTitle());
                    response.setChapterNumber(chapterInfo.getChapterNumber());
                }

            } catch (feign.FeignException.NotFound e) {
                // Xử lý riêng trường hợp truyện không tồn tại (404)
                log.warn("Manga not found for ID: {}", history.getMangaId());
                response.setMangaTitle("Truyện đã bị xóa #" + history.getMangaId());
            } catch (Exception e) {
                log.error("Error getting manga/chapter info", e);
            }

            result.add(response);
        }

        return result;
    }

    /**
     * Lấy thống kê về lượt xem
     * @return Thống kê về lượt xem
     */
    public ViewStatisticsResponse getViewStatistics() {
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
     * Đếm tổng số lượt xem của người dùng đã đăng nhập
     * @return Tổng số lượt xem
     */
    public Long countTotalViews() {
        return historyRepository.countTotalViews();
    }

    /**
     * Đếm số lượt xem trong ngày hôm nay của người dùng đã đăng nhập
     * @return Số lượt xem trong ngày
     */
    public Long countTodayViews() {
        return historyRepository.countTodayViews();
    }

    /**
     * Đếm số lượt xem trong tuần này
     * @return Số lượt xem trong tuần
     */
    public Long countThisWeekViews() {
        Long registeredUserViews = historyRepository.countThisWeekViews();
        Long anonymousViews = anonymousHistoryRepository.countThisWeekViews();
        return registeredUserViews + anonymousViews;
    }

    /**
     * Đếm số lượt xem trong tháng này
     * @return Số lượt xem trong tháng
     */
    public Long countThisMonthViews() {
        Long registeredUserViews = historyRepository.countThisMonthViews();
        Long anonymousViews = anonymousHistoryRepository.countThisMonthViews();
        return registeredUserViews + anonymousViews;
    }

    /**
     * Lấy thống kê lượt xem theo ngày trong khoảng thời gian
     * @param days Số ngày cần lấy (7, 30, 90)
     * @return Danh sách thống kê lượt xem theo ngày
     */
    public List<ViewsByDayResponse> getViewsByDay(int days) {
        log.info("Getting views by day for the last {} days", days);

        // Tính toán ngày bắt đầu và ngày kết thúc
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1); // -1 vì bao gồm cả ngày hiện tại

        // Lấy dữ liệu lượt xem của người dùng đã đăng nhập
        List<Object[]> registeredUserViewsByDay = historyRepository.countViewsByDayBetween(startDate, endDate);

        // Lấy dữ liệu lượt xem của người dùng không đăng nhập
        List<Object[]> anonymousViewsByDay = anonymousHistoryRepository.countViewsByDayBetween(startDate, endDate);

        // Chuyển đổi dữ liệu sang Map để dễ xử lý
        Map<LocalDate, Long> registeredViewsMap = new HashMap<>();
        for (Object[] row : registeredUserViewsByDay) {
            LocalDate date = ((Date) row[0]).toLocalDate();
            Long views = ((Number) row[1]).longValue();
            registeredViewsMap.put(date, views);
        }

        Map<LocalDate, Long> anonymousViewsMap = new HashMap<>();
        for (Object[] row : anonymousViewsByDay) {
            LocalDate date = ((Date) row[0]).toLocalDate();
            Long views = ((Number) row[1]).longValue();
            anonymousViewsMap.put(date, views);
        }

        // Tạo danh sách tất cả các ngày trong khoảng thời gian
        List<LocalDate> allDates = Stream.iterate(startDate, date -> date.plusDays(1))
                .limit(ChronoUnit.DAYS.between(startDate, endDate) + 1)
                .collect(Collectors.toList());

        // Tạo kết quả trả về
        List<ViewsByDayResponse> result = new ArrayList<>();
        for (LocalDate date : allDates) {
            Long registeredViews = registeredViewsMap.getOrDefault(date, 0L);
            Long anonymousViews = anonymousViewsMap.getOrDefault(date, 0L);
            Long totalViews = registeredViews + anonymousViews;

            ViewsByDayResponse dayStats = ViewsByDayResponse.builder()
                    .date(date)
                    .views(totalViews)
                    .registeredUserViews(registeredViews)
                    .anonymousViews(anonymousViews)
                    .build();

            result.add(dayStats);
        }

        return result;
    }

    /**
     * Lấy thống kê lượt xem theo truyện
     * @param limit Số lượng truyện cần lấy (mặc định là 10)
     * @return Danh sách thống kê lượt xem theo truyện
     */
    public List<MangaViewsResponse> getViewsByManga(int limit) {
        log.info("Getting views by manga, limit: {}", limit);

        // Lấy danh sách truyện có lượt xem nhiều nhất (tổng hợp cả 2 loại người dùng)
        // Bước 1: Lấy lượt xem của người dùng đã đăng nhập
        List<Object[]> registeredUserViews = historyRepository.countViewsByManga();

        // Bước 2: Lấy lượt xem của người dùng không đăng nhập
        List<Object[]> anonymousViews = anonymousHistoryRepository.countViewsByManga();

        return processViewsByManga(registeredUserViews, anonymousViews, limit);
    }

    /**
     * Lấy thống kê lượt xem theo truyện trong khoảng thời gian
     * @param days Số ngày cần lấy (7, 30, 90)
     * @param limit Số lượng truyện cần lấy (mặc định là 10)
     * @return Danh sách thống kê lượt xem theo truyện
     */
    public List<MangaViewsResponse> getViewsByMangaInPeriod(int days, int limit) {
        log.info("Getting views by manga for the last {} days, limit: {}", days, limit);

        // Tính toán ngày bắt đầu và ngày kết thúc
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1); // -1 vì bao gồm cả ngày hiện tại

        // Lấy danh sách truyện có lượt xem nhiều nhất trong khoảng thời gian
        // Bước 1: Lấy lượt xem của người dùng đã đăng nhập
        List<Object[]> registeredUserViews = historyRepository.countViewsByMangaBetween(startDate, endDate);

        // Bước 2: Lấy lượt xem của người dùng không đăng nhập
        List<Object[]> anonymousViews = anonymousHistoryRepository.countViewsByMangaBetween(startDate, endDate);

        return processViewsByManga(registeredUserViews, anonymousViews, limit);
    }

    /**
     * Xử lý dữ liệu lượt xem theo truyện
     * @param registeredUserViews Lượt xem của người dùng đã đăng nhập
     * @param anonymousViews Lượt xem của người dùng không đăng nhập
     * @param limit Số lượng truyện cần lấy
     * @return Danh sách thống kê lượt xem theo truyện
     */
    private List<MangaViewsResponse> processViewsByManga(List<Object[]> registeredUserViews, List<Object[]> anonymousViews, int limit) {
        // Bước 3: Tổng hợp dữ liệu
        Map<String, Long> registeredViewsMap = new HashMap<>();
        for (Object[] row : registeredUserViews) {
            String mangaId = (String) row[0];
            Long views = ((Number) row[1]).longValue();
            registeredViewsMap.put(mangaId, views);
        }

        Map<String, Long> anonymousViewsMap = new HashMap<>();
        for (Object[] row : anonymousViews) {
            String mangaId = (String) row[0];
            Long views = ((Number) row[1]).longValue();
            anonymousViewsMap.put(mangaId, views);
        }

        // Bước 4: Tổng hợp tất cả mangaId
        Set<String> allMangaIds = new HashSet<>();
        allMangaIds.addAll(registeredViewsMap.keySet());
        allMangaIds.addAll(anonymousViewsMap.keySet());

        // Bước 5: Tính tổng lượt xem cho mỗi truyện
        Map<String, Long> totalViewsMap = new HashMap<>();
        for (String mangaId : allMangaIds) {
            Long registeredViews = registeredViewsMap.getOrDefault(mangaId, 0L);
            Long anonymousViewsCount = anonymousViewsMap.getOrDefault(mangaId, 0L);
            totalViewsMap.put(mangaId, registeredViews + anonymousViewsCount);
        }

        // Bước 6: Sắp xếp theo lượt xem giảm dần và giới hạn số lượng
        List<String> topMangaIds = totalViewsMap.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Bước 7: Lấy thông tin chi tiết của truyện từ Manga Service
        List<MangaViewsResponse> result = new ArrayList<>();
        for (String mangaId : topMangaIds) {
            Long registeredViews = registeredViewsMap.getOrDefault(mangaId, 0L);
            Long anonymousViewsCount = anonymousViewsMap.getOrDefault(mangaId, 0L);
            Long totalViews = totalViewsMap.get(mangaId);

            // Lấy thông tin truyện từ Manga Service
            String title = "";
            try {
                var mangaResponse = mangaClient.getMangaById(mangaId);
                if (mangaResponse != null && mangaResponse.getResult() != null) {
                    var mangaInfo = mangaResponse.getResult();
                    // Sử dụng trực tiếp đối tượng MangaInfoResponse thay vì ép kiểu thành Map
                    title = mangaInfo.getTitle();
                }
            } catch (feign.FeignException.NotFound e) {
                // Xử lý riêng trường hợp truyện không tồn tại (404)
                log.warn("Manga not found for ID: {}", mangaId);
                title = "Truyện đã bị xóa #" + mangaId;
            } catch (Exception e) {
                // Xử lý các lỗi khác
                log.error("Error getting manga info for ID: {}", mangaId, e);
                title = "Truyện #" + mangaId;
            }

            MangaViewsResponse mangaViews = MangaViewsResponse.builder()
                    .mangaId(mangaId)
                    .title(title)
                    .totalViews(totalViews)
                    .registeredUserViews(registeredViews)
                    .anonymousViews(anonymousViewsCount)
                    .build();

            result.add(mangaViews);
        }

        return result;
    }

    /**
     * Lấy tất cả mangaId đã đọc của người dùng
     * @param userId ID của người dùng
     * @return Danh sách tất cả mangaId đã đọc
     */
    public List<String> getAllReadMangaIds(String userId) {
        log.info("Getting all read manga IDs for user {}", userId);

        // Lấy tất cả mangaId đã đọc
        List<String> allReadMangaIds = historyRepository.findAllMangaIdsByUserId(userId);
        log.info("Retrieved {} manga IDs from reading history for user {}", allReadMangaIds.size(), userId);

        return allReadMangaIds;
    }
}
