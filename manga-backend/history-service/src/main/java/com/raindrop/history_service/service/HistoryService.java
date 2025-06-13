package com.raindrop.history_service.service;

import com.raindrop.history_service.repository.httpclient.MangaClient;
import com.raindrop.history_service.dto.request.HistoryRequest;
import com.raindrop.history_service.dto.response.HistoryResponse;
import com.raindrop.history_service.entity.History;
import com.raindrop.history_service.kafka.ChapterViewEventProducer;
import com.raindrop.history_service.mapper.HistoryMapper;
import com.raindrop.history_service.repository.HistoryRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class HistoryService {
    HistoryMapper historyMapper;
    HistoryRepository historyRepository;
    ChapterViewEventProducer chapterViewEventProducer;
    MangaClient mangaClient;


    @Transactional
    public HistoryResponse markChapterAsRead(String userId, HistoryRequest request) {
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

        // Tạo response
        HistoryResponse response = historyMapper.toReadingHistoryResponse(history);

        // Bổ sung thông tin từ Manga Service
        enrichHistoryResponse(response, request.getMangaId(), request.getChapterId());

        return response;
    }

    public Page<HistoryResponse> getReadingHistory(String userId, Pageable pageable) {
        // Lấy lịch sử đọc theo manga (mỗi manga chỉ lấy chapter đọc gần nhất)
        Page<History> readingHistories = historyRepository
                .findLatestByUserIdGroupByManga(userId, pageable);

        // Create a new page with filtered content
        Page<HistoryResponse> result = readingHistories.map(history -> {
            HistoryResponse response = historyMapper.toReadingHistoryResponse(history);
            // Bổ sung thông tin từ Manga Service
            enrichHistoryResponse(response, history.getMangaId(), history.getChapterId());
            return response;
        });

        // Create a new filtered list instead of modifying the original
        List<HistoryResponse> filteredContent = result.getContent().stream()
                .filter(historyResponse -> !historyResponse.getMangaTitle().equalsIgnoreCase("Truyện đã bị xóa"))
                .collect(Collectors.toList());

        // Return a new PageImpl with the filtered content
        return new PageImpl<>(filteredContent, pageable,
                filteredContent.size() == result.getContent().size() ? result.getTotalElements() : filteredContent.size());
    }

    public HistoryResponse getMangaReadingHistory(String userId, String mangaId) {
        // Lấy lịch sử đọc gần nhất của manga
        History history = historyRepository
                .findFirstByUserIdAndMangaIdOrderByUpdatedAtDesc(userId, mangaId)
                .orElseThrow(() -> new RuntimeException("Reading history not found"));

        HistoryResponse response = historyMapper.toReadingHistoryResponse(history);

        // Bổ sung thông tin từ Manga Service
        enrichHistoryResponse(response, mangaId, history.getChapterId());
        return response;
    }

    public List<HistoryResponse> getRecentReadingHistory(String userId, int limit) {
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
            enrichHistoryResponse(response, history.getMangaId(), history.getChapterId());
            if (!response.getMangaTitle().equalsIgnoreCase("Truyện đã bị xóa")) {
                result.add(response);
            }
        }

        return result;
    }

    public List<String> getAllReadMangaIds(String userId) {
        List<String> allReadMangaIds = historyRepository.findAllMangaIdsByUserId(userId);
        return allReadMangaIds;
    }

    private void enrichHistoryResponse(HistoryResponse response, String mangaId, String chapterId) {
        try {
            var mangaResponse = mangaClient.getMangaById(mangaId);


            // Xử lý dữ liệu từ manga response
            if (mangaResponse != null && mangaResponse.getResult() != null) {
                var mangaInfo = mangaResponse.getResult();
                response.setMangaTitle(mangaInfo.getTitle());
                response.setMangaCoverUrl(mangaInfo.getCoverUrl());
                response.setAuthor(mangaInfo.getAuthor());
            }


        } catch (feign.FeignException.NotFound e) {
            response.setMangaTitle("Truyện đã bị xóa");
        } catch (Exception e) {
        }

        try {
            var chapterResponse = mangaClient.getChapterById(chapterId);
            // Xử lý dữ liệu từ chapter response
            if (chapterResponse != null && chapterResponse.getResult() != null) {
                var chapterInfo = chapterResponse.getResult();
                response.setChapterTitle(chapterInfo.getTitle());
                response.setChapterNumber(chapterInfo.getChapterNumber());
            }
        }catch (feign.FeignException.NotFound e) {
            response.setChapterTitle("Chương đã bị xóa");
            response.setChapterNumber(0);
        } catch (Exception e) {
        }
    }
}