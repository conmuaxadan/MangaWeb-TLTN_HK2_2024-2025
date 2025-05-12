package com.raindrop.history_service.service;

import com.raindrop.history_service.repository.httpclient.MangaClient;
import com.raindrop.history_service.dto.request.ReadingHistoryRequest;
import com.raindrop.history_service.dto.response.ReadingHistoryResponse;
import com.raindrop.history_service.entity.ReadingHistory;
import com.raindrop.history_service.kafka.ChapterViewEventProducer;
import com.raindrop.history_service.mapper.ReadingHistoryMapper;
import com.raindrop.history_service.repository.ReadingHistoryRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReadingHistoryService {
    ReadingHistoryRepository readingHistoryRepository;
    ReadingHistoryMapper readingHistoryMapper;
    ChapterViewEventProducer chapterViewEventProducer;
    MangaClient mangaClient;

    /**
     * Đánh dấu đã đọc chapter
     * @param userId ID của người dùng
     * @param request Thông tin chapter đã đọc
     * @return Thông tin lịch sử đọc
     */
    @Transactional
    public ReadingHistoryResponse markChapterAsRead(String userId, ReadingHistoryRequest request) {
        log.info("Marking chapter {} of manga {} as read for user {}",
                request.getChapterId(), request.getMangaId(), userId);

        // Kiểm tra xem đã có lịch sử đọc cho chapter này chưa
        Optional<ReadingHistory> existingHistory = readingHistoryRepository
                .findByUserIdAndMangaIdAndChapterId(userId, request.getMangaId(), request.getChapterId());

        ReadingHistory readingHistory;
        if (existingHistory.isPresent()) {
            // Sử dụng lịch sử đọc hiện có (chỉ cập nhật thời gian)
            readingHistory = existingHistory.get();
        } else {
            // Tạo lịch sử đọc mới
            readingHistory = readingHistoryMapper.toReadingHistory(request, userId);
        }

        // Lưu lịch sử đọc
        readingHistory = readingHistoryRepository.save(readingHistory);

        // Gửi sự kiện tăng lượt xem qua Kafka
        chapterViewEventProducer.sendChapterViewEvent(
                request.getChapterId(),
                request.getMangaId(),
                userId
        );
        log.info("Sent chapter view event for chapter {} of manga {}",
                request.getChapterId(), request.getMangaId());

        // Tạo response
        ReadingHistoryResponse response = readingHistoryMapper.toReadingHistoryResponse(readingHistory);

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
                response.setChapterNumber((Integer) ((Map<String, Object>) chapterInfo).get("chapterNumber"));
            }

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
    public Page<ReadingHistoryResponse> getReadingHistory(String userId, Pageable pageable) {
        log.info("Getting reading history for user {}", userId);

        // Lấy lịch sử đọc theo manga (mỗi manga chỉ lấy chapter đọc gần nhất)
        Page<ReadingHistory> readingHistories = readingHistoryRepository
                .findLatestByUserIdGroupByManga(userId, pageable);

        return readingHistories.map(history -> {
            ReadingHistoryResponse response = readingHistoryMapper.toReadingHistoryResponse(history);

            // Bổ sung thông tin từ Manga Service
            try {
                var mangaResponse = mangaClient.getMangaById(history.getMangaId());
                var chapterResponse = mangaClient.getChapterById(history.getChapterId());

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
                    response.setChapterNumber((Integer) ((Map<String, Object>) chapterInfo).get("chapterNumber"));
                }

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
    public ReadingHistoryResponse getMangaReadingHistory(String userId, String mangaId) {
        log.info("Getting reading history for manga {} and user {}", mangaId, userId);

        // Lấy lịch sử đọc gần nhất của manga
        ReadingHistory readingHistory = readingHistoryRepository
                .findFirstByUserIdAndMangaIdOrderByUpdatedAtDesc(userId, mangaId)
                .orElseThrow(() -> new RuntimeException("Reading history not found"));

        ReadingHistoryResponse response = readingHistoryMapper.toReadingHistoryResponse(readingHistory);

        // Bổ sung thông tin từ Manga Service
        try {
            var mangaResponse = mangaClient.getMangaById(mangaId);
            var chapterResponse = mangaClient.getChapterById(readingHistory.getChapterId());

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
                response.setChapterNumber((Integer) ((Map<String, Object>) chapterInfo).get("chapterNumber"));
            }

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
    public List<ReadingHistoryResponse> getRecentReadingHistory(String userId, int limit) {
        log.info("Getting recent reading history for user {}, limit: {}", userId, limit);

        // Lấy tất cả lịch sử đọc của người dùng, sắp xếp theo thời gian gần nhất
        List<ReadingHistory> allHistory = readingHistoryRepository.findByUserIdOrderByUpdatedAtDesc(userId);

        // Lọc để mỗi manga chỉ lấy 1 lần (chapter mới nhất)
        Map<String, ReadingHistory> uniqueMangaMap = new LinkedHashMap<>(); // Sử dụng LinkedHashMap để giữ thứ tự

        for (ReadingHistory history : allHistory) {
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
        List<ReadingHistoryResponse> result = new ArrayList<>();
        for (ReadingHistory history : uniqueMangaMap.values()) {
            ReadingHistoryResponse response = readingHistoryMapper.toReadingHistoryResponse(history);

            // Bổ sung thông tin từ Manga Service
            try {
                var mangaResponse = mangaClient.getMangaById(history.getMangaId());
                var chapterResponse = mangaClient.getChapterById(history.getChapterId());

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
                    response.setChapterNumber((Integer) ((Map<String, Object>) chapterInfo).get("chapterNumber"));
                }

            } catch (Exception e) {
                log.error("Error getting manga/chapter info", e);
            }

            result.add(response);
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
        List<String> allReadMangaIds = readingHistoryRepository.findAllMangaIdsByUserId(userId);
        log.info("Retrieved {} manga IDs from reading history for user {}", allReadMangaIds.size(), userId);

        return allReadMangaIds;
    }
}
