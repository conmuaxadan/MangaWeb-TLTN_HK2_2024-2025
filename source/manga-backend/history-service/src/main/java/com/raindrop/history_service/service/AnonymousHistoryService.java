package com.raindrop.history_service.service;

import com.raindrop.history_service.repository.httpclient.MangaClient;
import com.raindrop.history_service.dto.request.AnonymousHistoryRequest;
import com.raindrop.history_service.dto.response.AnonymousHistoryResponse;
import com.raindrop.history_service.entity.AnonymousHistory;
import com.raindrop.history_service.kafka.ChapterViewEventProducer;
import com.raindrop.history_service.mapper.AnonymousHistoryMapper;
import com.raindrop.history_service.repository.AnonymousHistoryRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AnonymousHistoryService {
    AnonymousHistoryRepository anonymousHistoryRepository;
    AnonymousHistoryMapper anonymousHistoryMapper;
    ChapterViewEventProducer chapterViewEventProducer;
    MangaClient mangaClient;

    @Transactional
    public AnonymousHistoryResponse markChapterAsRead(AnonymousHistoryRequest request, String ipAddress) {
        // Kiểm tra xem đã có lịch sử đọc cho chapter này chưa
        Optional<AnonymousHistory> existingHistory = anonymousHistoryRepository
                .findBySessionIdAndMangaIdAndChapterId(request.getSessionId(), request.getMangaId(), request.getChapterId());

        AnonymousHistory readingHistory;
        readingHistory = existingHistory.orElseGet(() -> anonymousHistoryMapper.toAnonymousReadingHistory(request, ipAddress));

        // Lưu lịch sử đọc
        readingHistory = anonymousHistoryRepository.save(readingHistory);

        // Gửi sự kiện tăng lượt xem qua Kafka
        chapterViewEventProducer.sendChapterViewEvent(
                request.getChapterId(),
                request.getMangaId(),
                null
        );

        // Tạo response
        AnonymousHistoryResponse response = anonymousHistoryMapper.toAnonymousReadingHistoryResponse(readingHistory);

        // Bổ sung thông tin từ Manga Service
        enrichAnonymousHistoryResponse(response, request.getMangaId(), request.getChapterId());

        return response;
    }

    public Page<AnonymousHistoryResponse> getReadingHistory(String sessionId, Pageable pageable) {
        // Lấy lịch sử đọc theo manga (mỗi manga chỉ lấy chapter đọc gần nhất)
        Page<AnonymousHistory> readingHistories = anonymousHistoryRepository
                .findLatestBySessionIdGroupByManga(sessionId, pageable);

        return readingHistories.map(history -> {
            AnonymousHistoryResponse response = anonymousHistoryMapper.toAnonymousReadingHistoryResponse(history);

            // Bổ sung thông tin từ Manga Service
            enrichAnonymousHistoryResponse(response, history.getMangaId(), history.getChapterId());

            return response;
        });
    }

    /**
     * Lấy lịch sử đọc của một manga cụ thể cho người dùng không đăng nhập
     * @param sessionId ID phiên của người dùng
     * @param mangaId ID của manga
     * @return Thông tin lịch sử đọc
     */
    public AnonymousHistoryResponse getMangaReadingHistory(String sessionId, String mangaId) {
        // Lấy lịch sử đọc gần nhất của manga
        AnonymousHistory readingHistory = anonymousHistoryRepository
                .findFirstBySessionIdAndMangaIdOrderByUpdatedAtDesc(sessionId, mangaId)
                .orElseThrow(() -> new RuntimeException("Reading history not found"));

        AnonymousHistoryResponse response = anonymousHistoryMapper.toAnonymousReadingHistoryResponse(readingHistory);

        // Bổ sung thông tin từ Manga Service
        enrichAnonymousHistoryResponse(response, mangaId, readingHistory.getChapterId());

        return response;
    }

    public Long countDistinctSessions() {
        return anonymousHistoryRepository.countDistinctSessions();
    }

    public Long countDistinctSessionsByMangaId(String mangaId) {
        return anonymousHistoryRepository.countDistinctSessionsByMangaId(mangaId);
    }

    public Long countDistinctSessionsByChapterId(String chapterId) {
        return anonymousHistoryRepository.countDistinctSessionsByChapterId(chapterId);
    }

    public Long countTotalViews() {
        return anonymousHistoryRepository.countTotalViews();
    }

    public Long countTodayViews() {
        return anonymousHistoryRepository.countTodayViews();
    }

    /**
     * Bổ sung thông tin truyện và chapter từ Manga Service vào AnonymousHistoryResponse
     * @param response Đối tượng AnonymousHistoryResponse cần bổ sung thông tin
     * @param mangaId ID của manga
     * @param chapterId ID của chapter
     */
    private void enrichAnonymousHistoryResponse(AnonymousHistoryResponse response, String mangaId, String chapterId) {
        try {
            var mangaResponse = mangaClient.getMangaById(mangaId);
            var chapterResponse = mangaClient.getChapterById(chapterId);

            // Xử lý dữ liệu từ manga response
            if (mangaResponse != null && mangaResponse.getResult() != null) {
                var mangaInfo = mangaResponse.getResult();
                response.setMangaTitle(mangaInfo.getTitle());
                response.setMangaCoverUrl(mangaInfo.getCoverUrl());
                response.setAuthor(mangaInfo.getAuthor());
            }

            // Xử lý dữ liệu từ chapter response
            if (chapterResponse != null && chapterResponse.getResult() != null) {
                var chapterInfo = chapterResponse.getResult();
                response.setChapterTitle(chapterInfo.getTitle());
                response.setChapterNumber(chapterInfo.getChapterNumber());
            }

        } catch (Exception e) {
        }
    }
}
