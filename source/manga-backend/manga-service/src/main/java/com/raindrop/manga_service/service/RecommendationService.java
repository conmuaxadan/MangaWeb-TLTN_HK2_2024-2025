package com.raindrop.manga_service.service;

import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.MangaSummaryResponse;
import com.raindrop.manga_service.dto.response.ReadingHistoryResponse;
import com.raindrop.manga_service.entity.Genre;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.mapper.MangaMapper;
import com.raindrop.manga_service.repository.ChapterRepository;
import com.raindrop.manga_service.repository.MangaRepository;
import com.raindrop.manga_service.repository.httpclient.HistoryClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;


import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RecommendationService {
    MangaRepository mangaRepository;
    ChapterRepository chapterRepository;
    HistoryClient historyClient;
    MangaMapper mangaMapper;

    public List<MangaSummaryResponse> getRecommendationsByGenreSummary(String userId, Integer limit) {
        // Số lượng manga gợi ý mặc định là 6
        int recommendationLimit = (limit != null && limit > 0) ? limit : 6;
        String authHeader = getAuthorizationHeader();

        try {
            // 1. Lấy lịch sử đọc gần đây
            List<ReadingHistoryResponse> recentHistory = getRecentReadingHistory(userId, authHeader);
            if (recentHistory.isEmpty()) {
                return Collections.emptyList();
            }

            // 2. Lấy danh sách mangaId gần đây
            List<String> recentMangaIds = extractMangaIdsFromHistory(recentHistory);
            log.info("Manga IDs gần đây của người dùng {}: {}", userId, recentMangaIds);

            // 3. Lấy tất cả mangaId đã đọc để loại trừ khỏi kết quả gợi ý
            List<String> allReadMangaIds = getAllReadMangaIds(userId, recentMangaIds, authHeader);

            // 4. Lấy thông tin chi tiết của các manga gần đây
            List<Manga> recentMangas = getRecentMangasDetails(recentMangaIds);
            if (recentMangas.isEmpty()) {
                return Collections.emptyList();
            }

            // 5. Xác định thể loại mục tiêu dựa trên trọng số
            List<String> targetGenres = determineTargetGenres(recentMangas, userId);
            if (targetGenres.isEmpty()) {
                log.info("Không có thể loại mục tiêu cho người dùng {}, không trả về gợi ý", userId);
                return Collections.emptyList();
            }

            // 6. Tìm manga tương tự dựa trên thể loại mục tiêu
            List<Manga> recommendedMangas = findSimilarMangas(targetGenres, allReadMangaIds, recommendationLimit, userId);
            if (recommendedMangas.isEmpty()) {
                return Collections.emptyList();
            }

            // 7. Chuyển đổi kết quả sang MangaSummaryResponse và bổ sung thông tin lastChapterNumber
            return recommendedMangas.stream()
                    .map(manga -> {
                        MangaSummaryResponse response = mangaMapper.toMangaSummaryResponse(manga);

                        // Bổ sung thông tin lastChapterNumber nếu có lastChapterId
                        if (manga.getLastChapterId() != null) {
                            chapterRepository.findById(manga.getLastChapterId()).ifPresent(chapter -> {
                                response.setLastChapterNumber(chapter.getChapterNumber());
                            });
                        }

                        return response;
                    })
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Lỗi khi lấy gợi ý manga cho người dùng {}: {}", userId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    private String getAuthorizationHeader() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes.getRequest().getHeader("Authorization");
    }

    private List<ReadingHistoryResponse> getRecentReadingHistory(String userId, String authHeader) {
        log.info("Gọi API lấy lịch sử đọc gần đây cho người dùng: {}", userId);

        try {
            ApiResponse<List<ReadingHistoryResponse>> historyResponse = historyClient.getRecentReadingHistory(authHeader, userId, 3);

            if (historyResponse.getCode() != 200 || historyResponse.getResult().isEmpty()) {
                log.info("Không tìm thấy lịch sử đọc cho người dùng {}, không trả về gợi ý", userId);
                return Collections.emptyList();
            }

            return historyResponse.getResult();

        } catch (Exception e) {
            log.error("Lỗi khi gọi API lấy lịch sử đọc: {}", e.getMessage());
            return Collections.emptyList();
        }
    }


    private List<String> extractMangaIdsFromHistory(List<ReadingHistoryResponse> recentHistory) {
        return recentHistory.stream()
                .map(ReadingHistoryResponse::getMangaId)
                .distinct()
                .collect(Collectors.toList());
    }

    private List<String> getAllReadMangaIds(String userId, List<String> recentMangaIds, String authHeader) {
        log.info("Gọi API lấy tất cả mangaId đã đọc cho người dùng: {}", userId);

        try {
            ApiResponse<List<String>> allReadMangaIdsResponse = historyClient.getAllReadMangaIds(authHeader, userId);

            if (allReadMangaIdsResponse.getCode() != 200 || allReadMangaIdsResponse.getResult() == null) {
                log.warn("Không thể lấy tất cả mangaId đã đọc, sử dụng danh sách gần đây");
                return new ArrayList<>(recentMangaIds);
            }

            List<String> allReadMangaIds = allReadMangaIdsResponse.getResult();
            log.info("Lấy được {} mangaId đã đọc của người dùng {}", allReadMangaIds.size(), userId);
            return allReadMangaIds;

        } catch (Exception e) {
            log.error("Lỗi khi gọi API lấy tất cả mangaId đã đọc: {}", e.getMessage());
            return new ArrayList<>(recentMangaIds);
        }
    }

    private List<Manga> getRecentMangasDetails(List<String> recentMangaIds) {
        List<Manga> recentMangas = mangaRepository.findAllById(recentMangaIds);

        if (recentMangas.isEmpty()) {
            log.warn("Không tìm thấy thông tin chi tiết cho lịch sử đọc: {}", recentMangaIds);
            return Collections.emptyList();
        }

        // Ghi log thông tin chi tiết về các manga gần đây
        for (Manga manga : recentMangas) {
            List<String> genreNames = manga.getGenres().stream()
                    .map(Genre::getName)
                    .collect(Collectors.toList());
            log.info("Manga gần đây: {} (ID: {}), Thể loại: {}", manga.getTitle(), manga.getId(), genreNames);
        }

        return recentMangas;
    }

    private List<String> determineTargetGenres(List<Manga> recentMangas, String userId) {
        // Tính toán trọng số thể loại
        Map<String, Double> genreWeights = calculateGenreWeights(recentMangas);

        // Kiểm tra xem có thể loại nào được tìm thấy không
        if (genreWeights.isEmpty()) {
            log.warn("Không tìm thấy thể loại nào trong các manga gần đây của người dùng {}", userId);

            // Tìm tất cả các thể loại trong hệ thống
            List<String> allGenres = mangaRepository.findAllGenreNames();
            if (allGenres.isEmpty()) {
                log.warn("Không tìm thấy thể loại nào trong hệ thống");
                return Collections.emptyList();
            }

            // Sử dụng tất cả các thể loại với trọng số bằng nhau
            for (String genre : allGenres) {
                genreWeights.put(genre, 1.0 / allGenres.size());
            }

            log.info("Sử dụng tất cả các thể loại với trọng số bằng nhau: {}", genreWeights);
        }

        // Lấy danh sách thể loại có trọng số, sắp xếp theo trọng số giảm dần
        List<String> targetGenres = genreWeights.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        log.info("Danh sách thể loại mục tiêu cho người dùng {}: {}", userId, targetGenres);
        return targetGenres;
    }

    /**
     * Tìm manga tương tự dựa trên thể loại mục tiêu
     *
     * @param targetGenres    Danh sách thể loại mục tiêu
     * @param allReadMangaIds Danh sách mangaId đã đọc
     * @param limit           Số lượng manga cần lấy
     * @param userId          ID của người dùng
     * @return Danh sách manga được gợi ý
     */
    private List<Manga> findSimilarMangas(List<String> targetGenres, List<String> allReadMangaIds, int limit, String userId) {
        // Đảm bảo danh sách excludeMangaIds không trống để tránh lỗi SQL
        if (allReadMangaIds.isEmpty()) {
            // Nếu không có manga nào để loại trừ, thêm một ID không tồn tại
            allReadMangaIds = new ArrayList<>();
            allReadMangaIds.add("no-manga-id");
        }

        // Gọi truy vấn tìm manga dựa trên thể loại
        List<Manga> recommendedMangas = mangaRepository.findMangasByGenres(
                targetGenres, allReadMangaIds, PageRequest.of(0, limit));

        // Ghi log kết quả truy vấn
        log.info("Tìm thấy {} manga phù hợp với thể loại cho người dùng {}", recommendedMangas.size(), userId);

        // Nếu không tìm thấy manga nào phù hợp, trả về danh sách rỗng
        if (recommendedMangas.isEmpty()) {
            log.info("Không tìm thấy manga nào phù hợp với thể loại, không trả về gợi ý");
            return Collections.emptyList();
        }

        return recommendedMangas;
    }

    /**
     * Tính toán trọng số cho từng thể loại dựa trên lịch sử đọc
     *
     * @param recentMangas Danh sách manga gần đây
     * @return Map chứa tên thể loại và trọng số tương ứng
     */
    private Map<String, Double> calculateGenreWeights(List<Manga> recentMangas) {
        // Đếm số lần xuất hiện của mỗi thể loại
        Map<String, Integer> genreCounts = new HashMap<>();
        int totalGenres = 0;

        for (Manga manga : recentMangas) {
            for (Genre genre : manga.getGenres()) {
                String genreName = genre.getName();
                genreCounts.put(genreName, genreCounts.getOrDefault(genreName, 0) + 1);
                totalGenres++;
            }
        }

        // Tính trọng số cho mỗi thể loại
        Map<String, Double> genreWeights = new HashMap<>();
        for (Map.Entry<String, Integer> entry : genreCounts.entrySet()) {
            genreWeights.put(entry.getKey(), (double) entry.getValue() / totalGenres);
        }

        return genreWeights;
    }
}
