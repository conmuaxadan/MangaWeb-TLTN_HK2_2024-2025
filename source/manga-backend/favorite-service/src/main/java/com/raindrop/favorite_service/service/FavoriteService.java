package com.raindrop.favorite_service.service;

import com.raindrop.favorite_service.dto.request.FavoriteRequest;
import com.raindrop.favorite_service.dto.response.ApiResponse;
import com.raindrop.favorite_service.dto.response.FavoriteResponse;
import com.raindrop.favorite_service.dto.response.MangaInfoResponse;
import com.raindrop.favorite_service.entity.Favorite;
import com.raindrop.favorite_service.kafka.FavoriteEventProducer;
import com.raindrop.favorite_service.mapper.FavoriteMapper;
import com.raindrop.favorite_service.repository.FavoriteRepository;
import com.raindrop.favorite_service.repository.httpclient.MangaClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class FavoriteService {
    FavoriteRepository favoriteMangaRepository;
    FavoriteMapper favoriteMangaMapper;
    MangaClient mangaClient;
    FavoriteEventProducer favoriteEventProducer;

    /**
     * Thêm manga vào danh sách yêu thích
     * @param userId ID của người dùng (từ JWT token)
     * @param request Thông tin manga cần thêm vào yêu thích
     * @return Thông tin manga đã thêm vào yêu thích
     */
    @Transactional
    public FavoriteResponse addFavorite(String userId, FavoriteRequest request) {
        log.info("Adding manga {} to favorites for user {}", request.getMangaId(), userId);

        // Kiểm tra xem đã thêm vào yêu thích chưa
        if (favoriteMangaRepository.existsByUserIdAndMangaId(userId, request.getMangaId())) {
            log.info("Manga {} already in favorites for user {}", request.getMangaId(), userId);
            Favorite existingFavorite = favoriteMangaRepository.findByUserIdAndMangaId(userId, request.getMangaId())
                    .orElseThrow(() -> new RuntimeException("Favorite manga not found"));

            return enrichFavoriteResponse(favoriteMangaMapper.toFavoriteResponse(existingFavorite), userId);
        }

        // Tạo mới favorite
        Favorite favorite = favoriteMangaMapper.toFavorite(request);
        favorite.setUserId(userId);

        favorite = favoriteMangaRepository.save(favorite);
        log.info("Manga {} added to favorites with ID: {}", request.getMangaId(), favorite.getId());

        // Gửi event đến Kafka
        favoriteEventProducer.sendAddedEvent(request.getMangaId());

        // Tạo response
        FavoriteResponse response = favoriteMangaMapper.toFavoriteResponse(favorite);
        return enrichFavoriteResponse(response, userId);
    }

    /**
     * Xóa manga khỏi danh sách yêu thích
     * @param userId ID của người dùng (từ JWT token)
     * @param mangaId ID của manga cần xóa khỏi yêu thích
     */
    @Transactional
    public void removeFavorite(String userId, String mangaId) {
        log.info("Removing manga {} from favorites for user {}", mangaId, userId);
        // Kiểm tra xem có trong danh sách yêu thích không
        if (!favoriteMangaRepository.existsByUserIdAndMangaId(userId, mangaId)) {
            log.info("Manga {} not in favorites for user {}", mangaId, userId);
            return;
        }

        // Xóa khỏi danh sách yêu thích
        favoriteMangaRepository.deleteByUserIdAndMangaId(userId, mangaId);
        log.info("Manga {} removed from favorites for user {}", mangaId, userId);

        // Gửi event đến Kafka
        favoriteEventProducer.sendRemovedEvent(mangaId);
    }

    /**
     * Kiểm tra xem manga có trong danh sách yêu thích của người dùng không
     * @param userId ID của người dùng (từ JWT token)
     * @param mangaId ID của manga cần kiểm tra
     * @return true nếu manga có trong danh sách yêu thích, false nếu không
     */
    public boolean isFavorite(String userId, String mangaId) {
        log.info("Checking if manga {} is in favorites for user {}", mangaId, userId);
        // Kiểm tra xem có trong danh sách yêu thích không
        boolean isFavorite = favoriteMangaRepository.existsByUserIdAndMangaId(userId, mangaId);
        log.info("Manga {} is {} favorites for user {}", mangaId, isFavorite ? "in" : "not in", userId);

        return isFavorite;
    }

    /**
     * Lấy danh sách manga yêu thích của người dùng
     * @param userId ID của người dùng (từ JWT token)
     * @param pageable Thông tin phân trang
     * @return Danh sách manga yêu thích có phân trang
     */
    public Page<FavoriteResponse> getFavorites(String userId, Pageable pageable) {
        log.info("Getting favorites for user {}", userId);
        // Lấy danh sách yêu thích
        Page<Favorite> favorites = favoriteMangaRepository.findByUserId(userId, pageable);
        log.info("Found {} favorites for user {}", favorites.getTotalElements(), userId);

        // Tạo response
        return favorites.map(favorite -> {
            FavoriteResponse response = favoriteMangaMapper.toFavoriteResponse(favorite);
            return enrichFavoriteResponse(response, userId);
        });
    }

    /**
     * Bổ sung thông tin cho FavoriteResponse từ Manga Service và UserProfile
     * @param response FavoriteResponse cần bổ sung thông tin
     * @return FavoriteResponse đã được bổ sung thông tin
     */
    private FavoriteResponse enrichFavoriteResponse(FavoriteResponse response, String userId) {
        response.setUserId(userId);
        // Bổ sung thông tin manga từ Manga Service
        try {
            ApiResponse<MangaInfoResponse> mangaResponse = mangaClient.getMangaById(response.getMangaId());
            if (mangaResponse != null && mangaResponse.getCode() == 200 && mangaResponse.getResult() != null) {
                MangaInfoResponse mangaInfo = mangaResponse.getResult();
                response.setMangaTitle(mangaInfo.getTitle());
                response.setMangaCoverUrl(mangaInfo.getCoverUrl());
                response.setAuthor(mangaInfo.getAuthor());
                response.setDescription(mangaInfo.getDescription());
                response.setViews(mangaInfo.getViews());
                response.setLoves(mangaInfo.getLoves());
                response.setComments(mangaInfo.getComments());
            }
        } catch (Exception e) {
            log.error("Error getting manga info for ID {}: {}", response.getMangaId(), e.getMessage());
        }

        return response;
    }

    /**
     * Đếm số lượng yêu thích của một manga
     * @param mangaId ID của manga
     * @return Số lượng yêu thích
     */
    public long countFavoritesByMangaId(String mangaId) {
        log.info("Counting favorites for manga {}", mangaId);
        return favoriteMangaRepository.countByMangaId(mangaId);
    }

    /**
     * Đếm tổng số yêu thích trong hệ thống
     * @return Tổng số yêu thích
     */
    public long countTotalFavorites() {
        log.info("Counting total favorites");
        return favoriteMangaRepository.countTotalFavorites();
    }

    /**
     * Đếm số yêu thích mới trong ngày hôm nay
     * @return Số yêu thích mới trong ngày
     */
    public long countTodayFavorites() {
        log.info("Counting today's favorites");
        return favoriteMangaRepository.countTodayFavorites();
    }

    public List<String> userIdsByMangaId(String mangaId) {
        log.info("Getting user IDs for manga {}", mangaId);
        return favoriteMangaRepository.findUserIdsByMangaId(mangaId);
    }


}
