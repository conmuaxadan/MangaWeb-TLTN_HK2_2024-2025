package com.raindrop.profile_service.service;

import com.raindrop.profile_service.dto.request.AnonymousReadingHistoryRequest;
import com.raindrop.profile_service.dto.response.AnonymousReadingHistoryResponse;
import com.raindrop.profile_service.dto.response.ChapterInfoResponse;
import com.raindrop.profile_service.dto.response.MangaInfoResponse;
import com.raindrop.profile_service.dto.response.manga.ApiResponse;
import com.raindrop.profile_service.entity.AnonymousReadingHistory;
import com.raindrop.profile_service.kafka.ChapterViewEventProducer;
import com.raindrop.profile_service.mapper.AnonymousReadingHistoryMapper;
import com.raindrop.profile_service.repository.AnonymousReadingHistoryRepository;
import com.raindrop.profile_service.repository.httpclient.MangaClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AnonymousReadingHistoryService {
    AnonymousReadingHistoryRepository anonymousReadingHistoryRepository;
    AnonymousReadingHistoryMapper anonymousReadingHistoryMapper;
    ChapterViewEventProducer chapterViewEventProducer;
    MangaClient mangaClient;
    
    /**
     * Đánh dấu đã đọc chapter cho người dùng không đăng nhập
     * @param request Thông tin chapter đã đọc
     * @param ipAddress Địa chỉ IP của người dùng
     * @param userAgent User-Agent của trình duyệt
     * @return Thông tin lịch sử đọc
     */
    @Transactional
    public AnonymousReadingHistoryResponse markChapterAsRead(AnonymousReadingHistoryRequest request, String ipAddress, String userAgent) {
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
            readingHistory = anonymousReadingHistoryMapper.toAnonymousReadingHistory(request, ipAddress, userAgent);
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
            ApiResponse<MangaInfoResponse> mangaInfo = mangaClient.getMangaById(request.getMangaId());
            if (mangaInfo != null && mangaInfo.getResult() != null) {
                response.setMangaTitle(mangaInfo.getResult().getTitle());
                response.setMangaCoverUrl(mangaInfo.getResult().getCoverUrl());
            }
            
            // Lấy thông tin chapter
            ApiResponse<ChapterInfoResponse> chapterInfo = mangaClient.getChapterById(request.getChapterId());
            if (chapterInfo != null && chapterInfo.getResult() != null) {
                ChapterInfoResponse chapterData = chapterInfo.getResult();
                response.setChapterTitle(chapterData.getTitle());
                response.setChapterNumber(chapterData.getChapterNumber());
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
                ApiResponse<MangaInfoResponse> mangaInfo = mangaClient.getMangaById(history.getMangaId());
                if (mangaInfo != null && mangaInfo.getResult() != null) {
                    response.setMangaTitle(mangaInfo.getResult().getTitle());
                    response.setMangaCoverUrl(mangaInfo.getResult().getCoverUrl());
                }
                
                // Lấy thông tin chapter
                ApiResponse<ChapterInfoResponse> chapterInfo = mangaClient.getChapterById(history.getChapterId());
                if (chapterInfo != null && chapterInfo.getResult() != null) {
                    ChapterInfoResponse chapterData = chapterInfo.getResult();
                    response.setChapterTitle(chapterData.getTitle());
                    response.setChapterNumber(chapterData.getChapterNumber());
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
            ApiResponse<MangaInfoResponse> mangaInfo = mangaClient.getMangaById(mangaId);
            if (mangaInfo != null && mangaInfo.getResult() != null) {
                response.setMangaTitle(mangaInfo.getResult().getTitle());
                response.setMangaCoverUrl(mangaInfo.getResult().getCoverUrl());
            }
            
            // Lấy thông tin chapter
            ApiResponse<ChapterInfoResponse> chapterInfo = mangaClient.getChapterById(readingHistory.getChapterId());
            if (chapterInfo != null && chapterInfo.getResult() != null) {
                ChapterInfoResponse chapterData = chapterInfo.getResult();
                response.setChapterTitle(chapterData.getTitle());
                response.setChapterNumber(chapterData.getChapterNumber());
            }
        } catch (Exception e) {
            log.error("Error getting manga/chapter info", e);
        }
        
        return response;
    }
}
