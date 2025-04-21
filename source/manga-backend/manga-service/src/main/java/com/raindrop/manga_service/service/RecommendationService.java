package com.raindrop.manga_service.service;

import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.MangaResponse;
import com.raindrop.manga_service.dto.response.ReadingHistoryResponse;
import com.raindrop.manga_service.entity.Genre;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.mapper.MangaMapper;
import com.raindrop.manga_service.repository.GenreRepository;
import com.raindrop.manga_service.repository.MangaRepository;
import com.raindrop.manga_service.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class RecommendationService {
    MangaRepository mangaRepository;
    GenreRepository genreRepository;
    ProfileClient profileClient;
    MangaMapper mangaMapper;

    /**
     * Lấy gợi ý manga dựa trên thể loại từ lịch sử đọc
     * @param userId ID của người dùng
     * @param limit Số lượng manga gợi ý (mặc định là 5)
     * @return Danh sách manga được gợi ý
     */
    public List<MangaResponse> getRecommendationsByGenre(String userId, Integer limit) {
        int recommendationLimit = (limit != null && limit > 0) ? limit : 5;

        try {
            // 1. Lấy lịch sử đọc gần nhất (tối đa 3 manga)
            ApiResponse<List<ReadingHistoryResponse>> historyResponse =
                    profileClient.getRecentReadingHistory(userId, 3);

            if (historyResponse.getCode() != 1000 || historyResponse.getResult().isEmpty()) {
                log.info("No reading history found for user {}, returning popular manga", userId);
                return getPopularMangas(recommendationLimit);
            }

            List<ReadingHistoryResponse> recentHistory = historyResponse.getResult();

            // 2. Lấy danh sách mangaId từ lịch sử đọc
            List<String> recentMangaIds = recentHistory.stream()
                    .map(ReadingHistoryResponse::getMangaId)
                    .collect(Collectors.toList());

            // 3. Lấy thông tin chi tiết của các manga gần đây
            List<Manga> recentMangas = mangaRepository.findAllById(recentMangaIds);

            if (recentMangas.isEmpty()) {
                log.warn("Could not find manga details for history: {}", recentMangaIds);
                return getPopularMangas(recommendationLimit);
            }

            // 4. Tính toán trọng số thể loại
            Map<String, Double> genreWeights = calculateGenreWeights(recentMangas);

            log.info("Genre weights for user {}: {}", userId, genreWeights);

            // 5. Lấy danh sách thể loại có trọng số
            List<String> targetGenres = genreWeights.entrySet().stream()
                    .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList());

            // 6. Tìm manga tương tự
            List<Manga> recommendedMangas;

            if (targetGenres.isEmpty()) {
                recommendedMangas = mangaRepository.findByOrderByViewsDesc(PageRequest.of(0, recommendationLimit));
            } else {
                recommendedMangas = mangaRepository.findMangasByGenres(
                        targetGenres, recentMangaIds, PageRequest.of(0, recommendationLimit));
            }

            // 7. Chuyển đổi kết quả sang DTO
            return recommendedMangas.stream()
                    .map(mangaMapper::toMangaResponse)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error generating recommendations for user {}: {}", userId, e.getMessage(), e);
            return getPopularMangas(recommendationLimit);
        }
    }

    /**
     * Tính toán trọng số thể loại
     * @param recentMangas Danh sách manga gần đây
     * @return Map chứa trọng số của từng thể loại
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

        // Tính trọng số cho mỗi thể loại (tần suất xuất hiện)
        Map<String, Double> genreWeights = new HashMap<>();
        for (Map.Entry<String, Integer> entry : genreCounts.entrySet()) {
            // Trọng số = số lần xuất hiện / tổng số thể loại
            genreWeights.put(entry.getKey(), (double) entry.getValue() / totalGenres);
        }

        return genreWeights;
    }

    /**
     * Lấy manga phổ biến nhất
     * @param limit Số lượng manga cần lấy
     * @return Danh sách manga phổ biến nhất
     */
    private List<MangaResponse> getPopularMangas(int limit) {
        List<Manga> popularMangas = mangaRepository.findByOrderByViewsDesc(PageRequest.of(0, limit));
        return popularMangas.stream()
                .map(mangaMapper::toMangaResponse)
                .collect(Collectors.toList());
    }
}
