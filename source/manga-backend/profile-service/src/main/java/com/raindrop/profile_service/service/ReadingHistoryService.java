package com.raindrop.profile_service.service;

import com.raindrop.profile_service.client.MangaClient;
import com.raindrop.profile_service.dto.request.ReadingHistoryRequest;
import com.raindrop.profile_service.dto.response.ReadingHistoryResponse;
import com.raindrop.profile_service.entity.ReadingHistory;
import com.raindrop.profile_service.repository.ReadingHistoryRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ReadingHistoryService {
    ReadingHistoryRepository readingHistoryRepository;
    MangaClient mangaClient;
    
    /**
     * Lấy lịch sử đọc của một người dùng
     */
    public List<ReadingHistoryResponse> getUserReadingHistory(String userId) {
        log.info("Getting reading history for user: {}", userId);
        List<ReadingHistory> history = readingHistoryRepository.findByUserIdOrderByReadAtDesc(userId);
        
        return history.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Lấy lịch sử đọc của một người dùng với phân trang
     */
    public Page<ReadingHistoryResponse> getUserReadingHistoryPaginated(String userId, Pageable pageable) {
        log.info("Getting paginated reading history for user: {}", userId);
        Page<ReadingHistory> historyPage = readingHistoryRepository.findByUserId(userId, pageable);
        
        return historyPage.map(this::mapToResponse);
    }
    
    /**
     * Thêm hoặc cập nhật lịch sử đọc
     */
    @Transactional
    public ReadingHistoryResponse addToReadingHistory(String userId, ReadingHistoryRequest request) {
        log.info("Adding to reading history for user: {}, manga: {}, chapter: {}", 
                userId, request.getMangaId(), request.getChapterId());
        
        try {
            // Lấy thông tin manga và chapter từ Manga Service
            var mangaResponse = mangaClient.getMangaById(request.getMangaId()).getResult();
            var chapterResponse = mangaClient.getChapterById(request.getChapterId()).getResult();
            
            // Tìm hoặc tạo mới lịch sử đọc
            ReadingHistory history = readingHistoryRepository
                    .findByUserIdAndMangaIdAndChapterId(userId, request.getMangaId(), request.getChapterId())
                    .orElse(ReadingHistory.builder()
                            .userId(userId)
                            .mangaId(request.getMangaId())
                            .chapterId(request.getChapterId())
                            .build());
            
            // Cập nhật thông tin
            history.setLastPage(request.getLastPage());
            history.setMangaTitle(mangaResponse.title());
            history.setChapterNumber(chapterResponse.chapterNumber());
            
            // Lưu vào database
            history = readingHistoryRepository.save(history);
            
            // Tạo response
            ReadingHistoryResponse response = mapToResponse(history);
            response.setMangaCoverUrl(mangaResponse.coverUrl());
            response.setChapterTitle(chapterResponse.title());
            
            return response;
        } catch (Exception e) {
            log.error("Error adding to reading history", e);
            throw new RuntimeException("Failed to add to reading history", e);
        }
    }
    
    /**
     * Lấy lịch sử đọc của một manga cụ thể
     */
    public List<ReadingHistoryResponse> getUserMangaReadingHistory(String userId, String mangaId) {
        log.info("Getting reading history for user: {} and manga: {}", userId, mangaId);
        List<ReadingHistory> history = readingHistoryRepository.findByUserIdAndMangaIdOrderByReadAtDesc(userId, mangaId);
        
        return history.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Xóa một mục trong lịch sử đọc
     */
    @Transactional
    public void deleteReadingHistory(String userId, String historyId) {
        log.info("Deleting reading history entry: {} for user: {}", historyId, userId);
        readingHistoryRepository.deleteByUserIdAndId(userId, historyId);
    }
    
    /**
     * Xóa tất cả lịch sử đọc của một người dùng
     */
    @Transactional
    public void deleteAllReadingHistory(String userId) {
        log.info("Deleting all reading history for user: {}", userId);
        readingHistoryRepository.deleteAllByUserId(userId);
    }
    
    /**
     * Chuyển đổi từ entity sang response
     */
    private ReadingHistoryResponse mapToResponse(ReadingHistory history) {
        return ReadingHistoryResponse.builder()
                .id(history.getId())
                .userId(history.getUserId())
                .mangaId(history.getMangaId())
                .chapterId(history.getChapterId())
                .mangaTitle(history.getMangaTitle())
                .chapterNumber(history.getChapterNumber())
                .lastPage(history.getLastPage())
                .readAt(history.getReadAt())
                .updatedAt(history.getUpdatedAt())
                .build();
    }
}
