package com.raindrop.history_service.service;

import com.raindrop.history_service.repository.httpclient.MangaClient;
import com.raindrop.history_service.dto.request.AnonymousReadingHistoryRequest;
import com.raindrop.history_service.dto.response.AnonymousReadingHistoryResponse;
import com.raindrop.history_service.entity.AnonymousReadingHistory;
import com.raindrop.history_service.kafka.ChapterViewEventProducer;
import com.raindrop.history_service.mapper.AnonymousReadingHistoryMapper;
import com.raindrop.history_service.repository.AnonymousReadingHistoryRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AnonymousReadingHistoryService {
    AnonymousReadingHistoryRepository anonymousReadingHistoryRepository;
    AnonymousReadingHistoryMapper anonymousReadingHistoryMapper;
    ChapterViewEventProducer chapterViewEventProducer;
    MangaClient mangaClient;

    /**
     * Đánh dấu đã đọc chapter cho người dùng không đăng nhập
     * @param request Thông tin chapter đã đọc
     * @param ipAddress Địa chỉ IP của người dùng
     * @return Thông tin lịch sử đọc
     */
    @Transactional
    public AnonymousReadingHistoryResponse markChapterAsRead(AnonymousReadingHistoryRequest request, String ipAddress) {
        log.info("Marking chapter {} of manga {} as read for anonymous user with session {}",
                request.getChapterId(), request.getMangaId(), request.getSessionId());

        // Kiểm tra xem đã có lịch sử đọc cho chapter này chưa
        Optional<AnonymousReadingHistory> existingHistory = anonymousReadingHistoryRepository
                .findBySessionIdAndMangaIdAndChapterId(request.getSessionId(), request.getMangaId(), request.getChapterId());

        AnonymousReadingHistory readingHistory;
        if (existingHistory.isPresent()) {
            // Sử dụng lịch sử đọc hiện có (chỉ cập nhật thời gian)
            readingHistory = existingHistory.get();
        } else {
            // Tạo lịch sử đọc mới
            readingHistory = anonymousReadingHistoryMapper.toAnonymousReadingHistory(request, ipAddress);
        }

        // Lưu lịch sử đọc
        readingHistory = anonymousReadingHistoryRepository.save(readingHistory);

        // Gửi sự kiện tăng lượt xem qua Kafka
        chapterViewEventProducer.sendChapterViewEvent(
                request.getChapterId(),
                request.getMangaId(),
                null // userId null vì người dùng không đăng nhập
        );
        log.info("Sent chapter view event for anonymous user, chapter {} of manga {}",
                request.getChapterId(), request.getMangaId());

        // Tạo response
        AnonymousReadingHistoryResponse response = anonymousReadingHistoryMapper.toAnonymousReadingHistoryResponse(readingHistory);

        // Bổ sung thông tin từ Manga Service
        try {
            var mangaResponse = mangaClient.getMangaById(request.getMangaId());
            var chapterResponse = mangaClient.getChapterById(request.getChapterId());

            // Xử lý dữ liệu từ response và bổ sung vào response
            if (mangaResponse != null && mangaResponse.getResult() != null) {
                var mangaInfo = mangaResponse.getResult();
                response.setMangaTitle((String) ((Map<String, Object>) mangaInfo).get("title"));
                response.setMangaCoverUrl((String) ((Map<String, Object>) mangaInfo).get("coverUrl"));
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
     * Lấy lịch sử đọc của người dùng không đăng nhập
     * @param sessionId ID phiên của người dùng
     * @param pageable Thông tin phân trang
     * @return Danh sách lịch sử đọc có phân trang
     */
    public Page<AnonymousReadingHistoryResponse> getReadingHistory(String sessionId, Pageable pageable) {
        log.info("Getting reading history for anonymous user with session {}", sessionId);

        // Lấy lịch sử đọc theo manga (mỗi manga chỉ lấy chapter đọc gần nhất)
        Page<AnonymousReadingHistory> readingHistories = anonymousReadingHistoryRepository
                .findLatestBySessionIdGroupByManga(sessionId, pageable);

        return readingHistories.map(history -> {
            AnonymousReadingHistoryResponse response = anonymousReadingHistoryMapper.toAnonymousReadingHistoryResponse(history);

            // Bổ sung thông tin từ Manga Service
            try {
                var mangaResponse = mangaClient.getMangaById(history.getMangaId());
                var chapterResponse = mangaClient.getChapterById(history.getChapterId());

                // Xử lý dữ liệu từ response và bổ sung vào response
                if (mangaResponse != null && mangaResponse.getResult() != null) {
                    var mangaInfo = mangaResponse.getResult();
                    response.setMangaTitle((String) ((Map<String, Object>) mangaInfo).get("title"));
                    response.setMangaCoverUrl((String) ((Map<String, Object>) mangaInfo).get("coverUrl"));
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
     * Lấy lịch sử đọc của một manga cụ thể cho người dùng không đăng nhập
     * @param sessionId ID phiên của người dùng
     * @param mangaId ID của manga
     * @return Thông tin lịch sử đọc
     */
    public AnonymousReadingHistoryResponse getMangaReadingHistory(String sessionId, String mangaId) {
        log.info("Getting reading history for manga {} and anonymous user with session {}", mangaId, sessionId);

        // Lấy lịch sử đọc gần nhất của manga
        AnonymousReadingHistory readingHistory = anonymousReadingHistoryRepository
                .findFirstBySessionIdAndMangaIdOrderByUpdatedAtDesc(sessionId, mangaId)
                .orElseThrow(() -> new RuntimeException("Reading history not found"));

        AnonymousReadingHistoryResponse response = anonymousReadingHistoryMapper.toAnonymousReadingHistoryResponse(readingHistory);

        // Bổ sung thông tin từ Manga Service
        try {
            var mangaResponse = mangaClient.getMangaById(mangaId);
            var chapterResponse = mangaClient.getChapterById(readingHistory.getChapterId());

            // Xử lý dữ liệu từ response và bổ sung vào response
            if (mangaResponse != null && mangaResponse.getResult() != null) {
                var mangaInfo = mangaResponse.getResult();
                response.setMangaTitle((String) ((Map<String, Object>) mangaInfo).get("title"));
                response.setMangaCoverUrl((String) ((Map<String, Object>) mangaInfo).get("coverUrl"));
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
     * Đếm số lượng phiên duy nhất
     * @return Số lượng phiên duy nhất
     */
    public Long countDistinctSessions() {
        return anonymousReadingHistoryRepository.countDistinctSessions();
    }

    /**
     * Đếm số lượng phiên duy nhất đã đọc một manga cụ thể
     * @param mangaId ID của manga
     * @return Số lượng phiên duy nhất
     */
    public Long countDistinctSessionsByMangaId(String mangaId) {
        return anonymousReadingHistoryRepository.countDistinctSessionsByMangaId(mangaId);
    }

    /**
     * Đếm số lượng phiên duy nhất đã đọc một chapter cụ thể
     * @param chapterId ID của chapter
     * @return Số lượng phiên duy nhất
     */
    public Long countDistinctSessionsByChapterId(String chapterId) {
        return anonymousReadingHistoryRepository.countDistinctSessionsByChapterId(chapterId);
    }
}
