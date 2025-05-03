package com.raindrop.manga_service.service;

import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.MangaResponse;
import com.raindrop.manga_service.dto.response.ReadingHistoryResponse;
import com.raindrop.manga_service.entity.Genre;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.mapper.MangaMapper;
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
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RecommendationService {
    MangaRepository mangaRepository;
    ProfileClient profileClient;
    MangaMapper mangaMapper;

    /**
     * Lấy gợi ý manga dựa trên thể loại từ lịch sử đọc
     * @param userId ID của người dùng
     * @param limit Số lượng manga gợi ý (mặc định là 6)
     * @return Danh sách manga được gợi ý
     */
    public List<MangaResponse> getRecommendationsByGenre(String userId, Integer limit) {
        // Số lượng manga gợi ý mặc định là 6
        int recommendationLimit = (limit != null && limit > 0) ? limit : 6;

        try {
            // 1. Lấy lịch sử đọc gần đây (tối đa 3 manga)
            log.info("Gọi API lấy lịch sử đọc gần đây cho người dùng: {}", userId);

            ApiResponse<List<ReadingHistoryResponse>> historyResponse;
            try {
                historyResponse = profileClient.getRecentReadingHistory(userId, 3);
            } catch (Exception e) {
                log.error("Lỗi khi gọi API lấy lịch sử đọc: {}", e.getMessage());
                return Collections.emptyList();
            }

            if (historyResponse.getCode() != 1000 || historyResponse.getResult().isEmpty()) {
                log.info("Không tìm thấy lịch sử đọc cho người dùng {}, không trả về gợi ý", userId);
                return Collections.emptyList();
            }

            List<ReadingHistoryResponse> recentHistory = historyResponse.getResult();

            // 2. Lấy danh sách mangaId gần đây để xác định thể loại ưa thích
            List<String> recentMangaIds = recentHistory.stream()
                    .map(ReadingHistoryResponse::getMangaId)
                    .distinct() // Đảm bảo không có ID trùng lặp
                    .collect(Collectors.toList());

            log.info("Manga IDs gần đây của người dùng {}: {}", userId, recentMangaIds);

            // 3. Lấy tất cả mangaId đã đọc để loại trừ khỏi kết quả gợi ý
            log.info("Gọi API lấy tất cả mangaId đã đọc cho người dùng: {}", userId);

            ApiResponse<List<String>> allReadMangaIdsResponse;
            List<String> allReadMangaIds;
            try {
                allReadMangaIdsResponse = profileClient.getAllReadMangaIds(userId);
                if (allReadMangaIdsResponse.getCode() != 1000 || allReadMangaIdsResponse.getResult() == null) {
                    log.warn("Không thể lấy tất cả mangaId đã đọc, sử dụng danh sách gần đây");
                    allReadMangaIds = new ArrayList<>(recentMangaIds);
                } else {
                    allReadMangaIds = allReadMangaIdsResponse.getResult();
                    log.info("Lấy được {} mangaId đã đọc của người dùng {}", allReadMangaIds.size(), userId);
                }
            } catch (Exception e) {
                log.error("Lỗi khi gọi API lấy tất cả mangaId đã đọc: {}", e.getMessage());
                allReadMangaIds = new ArrayList<>(recentMangaIds);
            }

            // 4. Lấy thông tin chi tiết của các manga gần đây
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

            // 4. Tính toán trọng số thể loại
            Map<String, Double> genreWeights = calculateGenreWeights(recentMangas);

            log.info("Trọng số thể loại cho người dùng {}: {}", userId, genreWeights);

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

            // 5. Lấy danh sách thể loại có trọng số
            List<String> targetGenres = genreWeights.entrySet().stream()
                    .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList());

            log.info("Danh sách thể loại mục tiêu cho người dùng {}: {}", userId, targetGenres);

            // 6. Tìm manga tương tự
            List<Manga> recommendedMangas;

            if (targetGenres.isEmpty()) {
                log.info("Không có thể loại mục tiêu cho người dùng {}, không trả về gợi ý", userId);
                return Collections.emptyList();
            } else {
                log.info("Tìm manga với thể loại {} cho người dùng {}, loại trừ {} manga đã đọc", targetGenres, userId, allReadMangaIds.size());

                // Đảm bảo danh sách excludeMangaIds không trống để tránh lỗi SQL
                if (allReadMangaIds.isEmpty()) {
                    // Nếu không có manga nào để loại trừ, thêm một ID không tồn tại
                    allReadMangaIds = new ArrayList<>();
                    allReadMangaIds.add("no-manga-id");
                }

                // Gọi truy vấn tìm manga dựa trên thể loại
                recommendedMangas = mangaRepository.findMangasByGenres(
                        targetGenres, allReadMangaIds, PageRequest.of(0, recommendationLimit));

                // Ghi log kết quả truy vấn
                log.info("Tìm thấy {} manga phù hợp với thể loại cho người dùng {}", recommendedMangas.size(), userId);

                // Nếu không tìm thấy manga nào phù hợp, trả về danh sách rỗng
                if (recommendedMangas.isEmpty()) {
                    log.info("Không tìm thấy manga nào phù hợp với thể loại, không trả về gợi ý");
                    return Collections.emptyList();
                }

                // Ghi log số lượng manga tìm thấy
                log.info("Tìm thấy {} manga phù hợp với thể loại", recommendedMangas.size());
            }

            // 7. Chuyển đổi kết quả sang DTO
            return recommendedMangas.stream()
                    .map(mangaMapper::toMangaResponse)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Lỗi khi lấy gợi ý manga cho người dùng {}: {}", userId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Tính toán trọng số cho từng thể loại dựa trên lịch sử đọc
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
