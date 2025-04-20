package com.raindrop.manga_service.service;

import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.entity.ViewLog;
import com.raindrop.manga_service.enums.ErrorCode;
import com.raindrop.manga_service.exception.AppException;
import com.raindrop.manga_service.repository.ChapterRepository;
import com.raindrop.manga_service.repository.MangaRepository;
import com.raindrop.manga_service.repository.ViewLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ViewLogService {
    ViewLogRepository viewLogRepository;
    ChapterRepository chapterRepository;
    MangaRepository mangaRepository;
    MangaStatsService mangaStatsService;

    // Thời gian tối thiểu giữa các lượt xem (24 giờ)
    private static final int VIEW_COOLDOWN_HOURS = 24;

    /**
     * Ghi nhận lượt xem cho chapter
     * @param chapterId ID của chapter
     * @param userId ID của user (null nếu chưa đăng nhập)
     * @param sessionId ID của session
     * @param scrollPercentage Phần trăm cuộn trang (0-100)
     * @return true nếu ghi nhận thành công, false nếu không (đã xem gần đây)
     */
    @Transactional
    public boolean logChapterView(String chapterId, String userId, String sessionId, int scrollPercentage) {
        log.info("Logging view for chapter: {}, userId: {}, sessionId: {}, scrollPercentage: {}",
                chapterId, userId, sessionId, scrollPercentage);

        // Kiểm tra xem đã cuộn đủ % chưa
        if (scrollPercentage < 30) {
            log.info("Scroll percentage too low ({}%), not counting as a view", scrollPercentage);
            return false;
        }

        // Lấy thông tin chapter
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));

        // Lấy thông tin manga
        Manga manga = chapter.getManga();

        // Thời điểm 24 giờ trước
        LocalDateTime since = LocalDateTime.now().minusHours(VIEW_COOLDOWN_HOURS);

        // Kiểm tra xem đã xem gần đây chưa
        boolean alreadyViewed = false;

        if (userId != null) {
            // Nếu đã đăng nhập, kiểm tra theo userId
            alreadyViewed = viewLogRepository.existsByChapterAndUserIdAndCreatedAtAfter(chapter, userId, since);
        } else {
            // Nếu chưa đăng nhập, kiểm tra theo sessionId
            alreadyViewed = viewLogRepository.existsByChapterAndSessionIdAndCreatedAtAfter(chapter, sessionId, since);
        }

        if (alreadyViewed) {
            log.info("User/session already viewed this chapter recently, not counting as a new view");
            return false;
        }

        // Lấy thông tin request
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");

        // Tạo ViewLog
        ViewLog viewLog = ViewLog.builder()
                .chapter(chapter)
                .userId(userId)
                .sessionId(sessionId)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .isAuthenticated(userId != null)
                .build();

        // Lưu ViewLog
        viewLogRepository.save(viewLog);

        // Tăng lượt xem của chapter
        chapterRepository.incrementViews(chapterId);

        // Tăng lượt xem của manga
        mangaRepository.incrementViews(manga.getId());

        // Cập nhật tổng số lượt xem của manga
        mangaStatsService.updateMangaTotalViews(manga.getId());

        log.info("View logged successfully for chapter: {}", chapterId);
        return true;
    }

    /**
     * Tạo session ID mới
     * @return Session ID mới
     */
    public String generateSessionId() {
        return UUID.randomUUID().toString();
    }

    /**
     * Lấy địa chỉ IP của client
     * @param request HTTP request
     * @return Địa chỉ IP của client
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        return ipAddress;
    }

    /**
     * Lấy số lượt xem của một chapter
     * @param chapterId ID của chapter
     * @return Số lượt xem
     */
    public long getChapterViewCount(String chapterId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));
        return viewLogRepository.countByChapter(chapter);
    }

    /**
     * Lấy số lượt xem của một manga
     * @param mangaId ID của manga
     * @return Số lượt xem
     */
    public long getMangaViewCount(String mangaId) {
        // Kiểm tra manga có tồn tại không
        if (!mangaRepository.existsById(mangaId)) {
            throw new AppException(ErrorCode.MANGA_NOT_FOUND);
        }
        return viewLogRepository.countByMangaId(mangaId);
    }

    /**
     * Lấy số lượt xem của một chapter bởi user đã đăng nhập
     * @param chapterId ID của chapter
     * @return Số lượt xem
     */
    public long getAuthenticatedChapterViewCount(String chapterId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));
        return viewLogRepository.countByChapterAndIsAuthenticated(chapter, true);
    }

    /**
     * Lấy số lượt xem của một manga bởi user đã đăng nhập
     * @param mangaId ID của manga
     * @return Số lượt xem
     */
    public long getAuthenticatedMangaViewCount(String mangaId) {
        // Kiểm tra manga có tồn tại không
        if (!mangaRepository.existsById(mangaId)) {
            throw new AppException(ErrorCode.MANGA_NOT_FOUND);
        }
        return viewLogRepository.countByMangaIdAndIsAuthenticated(mangaId, true);
    }
}
