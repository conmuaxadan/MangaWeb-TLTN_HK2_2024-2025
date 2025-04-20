package com.raindrop.profile_service.service;

import com.raindrop.profile_service.dto.request.ReadingHistoryRequest;
import com.raindrop.profile_service.dto.response.ChapterInfoResponse;
import com.raindrop.profile_service.dto.response.MangaInfoResponse;
import com.raindrop.profile_service.dto.response.ReadingHistoryResponse;
import com.raindrop.profile_service.dto.response.manga.ApiResponse;
import com.raindrop.profile_service.entity.ReadingHistory;
import com.raindrop.profile_service.entity.UserProfile;
import com.raindrop.profile_service.mapper.ReadingHistoryMapper;
import com.raindrop.profile_service.repository.ReadingHistoryRepository;
import com.raindrop.profile_service.repository.UserProfileRepository;
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
public class ReadingHistoryService {
    ReadingHistoryRepository readingHistoryRepository;
    UserProfileRepository userProfileRepository;
    ReadingHistoryMapper readingHistoryMapper;
    MangaClient mangaClient;

    /**
     * Đánh dấu đã đọc chapter
     * @param userId ID của người dùng
     * @param request Thông tin chapter đã đọc
     * @return Thông tin lịch sử đọc
     */
    @Transactional
    public ReadingHistoryResponse markChapterAsRead(String userId, ReadingHistoryRequest request) {
        log.info("Marking chapter {} of manga {} as read for user {}", request.getChapterId(), request.getMangaId(), userId);

        // Lấy thông tin profile người dùng
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found"));

        // Kiểm tra xem đã có lịch sử đọc cho chapter này chưa
        Optional<ReadingHistory> existingHistory = readingHistoryRepository.findByUserProfileIdAndMangaIdAndChapterId(
                userProfile.getId(), request.getMangaId(), request.getChapterId());

        ReadingHistory readingHistory;
        if (existingHistory.isPresent()) {
            // Sử dụng lịch sử đọc hiện có (chỉ cập nhật thời gian)
            readingHistory = existingHistory.get();
            // Không cần cập nhật lastPage nữa
        } else {
            // Tạo lịch sử đọc mới
            readingHistory = readingHistoryMapper.toReadingHistory(request, userProfile);
        }

        // Lưu lịch sử đọc
        readingHistory = readingHistoryRepository.save(readingHistory);

        // Tạo response
        ReadingHistoryResponse response = readingHistoryMapper.toReadingHistoryResponse(readingHistory);

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
     * Lấy lịch sử đọc của người dùng
     * @param userId ID của người dùng
     * @param pageable Thông tin phân trang
     * @return Danh sách lịch sử đọc có phân trang
     */
    public Page<ReadingHistoryResponse> getReadingHistory(String userId, Pageable pageable) {
        log.info("Getting reading history for user {}", userId);

        // Lấy thông tin profile người dùng
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found"));

        // Lấy lịch sử đọc theo manga (mỗi manga chỉ lấy chapter đọc gần nhất)
        Page<ReadingHistory> readingHistories = readingHistoryRepository.findLatestByUserProfileIdGroupByManga(
                userProfile.getId(), pageable);

        // Tạo response
        return readingHistories.map(history -> {
            ReadingHistoryResponse response = readingHistoryMapper.toReadingHistoryResponse(history);

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
     * Lấy lịch sử đọc của một manga cụ thể
     * @param userId ID của người dùng
     * @param mangaId ID của manga
     * @return Thông tin lịch sử đọc
     */
    public ReadingHistoryResponse getMangaReadingHistory(String userId, String mangaId) {
        log.info("Getting reading history for manga {} and user {}", mangaId, userId);

        // Lấy thông tin profile người dùng
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found"));

        // Lấy lịch sử đọc gần nhất của manga
        ReadingHistory readingHistory = readingHistoryRepository.findFirstByUserProfileIdAndMangaIdOrderByUpdatedAtDesc(
                userProfile.getId(), mangaId)
                .orElseThrow(() -> new RuntimeException("Reading history not found"));

        // Tạo response
        ReadingHistoryResponse response = readingHistoryMapper.toReadingHistoryResponse(readingHistory);

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

    /**
     * Xóa lịch sử đọc
     * @param userId ID của người dùng
     * @param historyId ID của lịch sử đọc
     */
    @Transactional
    public void deleteReadingHistory(String userId, String historyId) {
        log.info("Deleting reading history {} for user {}", historyId, userId);

        // Lấy thông tin profile người dùng
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found"));

        // Lấy lịch sử đọc
        ReadingHistory readingHistory = readingHistoryRepository.findById(historyId)
                .orElseThrow(() -> new RuntimeException("Reading history not found"));

        // Kiểm tra xem lịch sử đọc có thuộc về người dùng không
        if (!readingHistory.getUserProfile().getId().equals(userProfile.getId())) {
            throw new RuntimeException("Reading history does not belong to user");
        }

        // Xóa lịch sử đọc
        readingHistoryRepository.delete(readingHistory);
    }
}
