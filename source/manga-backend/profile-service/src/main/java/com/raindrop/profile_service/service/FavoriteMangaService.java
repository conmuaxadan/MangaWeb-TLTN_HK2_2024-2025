package com.raindrop.profile_service.service;

import com.raindrop.profile_service.dto.request.FavoriteRequest;
import com.raindrop.profile_service.dto.response.FavoriteResponse;
import com.raindrop.profile_service.dto.response.MangaInfoResponse;
import com.raindrop.profile_service.dto.response.manga.ApiResponse;
import com.raindrop.profile_service.entity.FavoriteManga;
import com.raindrop.profile_service.entity.UserProfile;
import com.raindrop.profile_service.kafka.FavoriteEventProducer;
import com.raindrop.profile_service.mapper.FavoriteMangaMapper;
import com.raindrop.profile_service.repository.FavoriteMangaRepository;
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
public class FavoriteMangaService {
    FavoriteMangaRepository favoriteMangaRepository;
    FavoriteMangaMapper favoriteMangaMapper;
    UserProfileRepository userProfileRepository;
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

        // Lấy thông tin profile người dùng
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found"));

        String profileId = userProfile.getId();

        // Kiểm tra xem đã thêm vào yêu thích chưa
        if (favoriteMangaRepository.existsByUserProfileIdAndMangaId(profileId, request.getMangaId())) {
            log.info("Manga {} already in favorites for user {}", request.getMangaId(), userId);
            FavoriteManga existingFavorite = favoriteMangaRepository.findByUserProfileIdAndMangaId(profileId, request.getMangaId())
                    .orElseThrow(() -> new RuntimeException("Favorite manga not found"));

            return enrichFavoriteResponse(favoriteMangaMapper.toFavoriteResponse(existingFavorite), userProfile);
        }

        // Tạo mới favorite
        FavoriteManga favoriteManga = favoriteMangaMapper.toFavoriteManga(request);
        favoriteManga.setUserProfile(userProfile);

        favoriteManga = favoriteMangaRepository.save(favoriteManga);
        log.info("Manga {} added to favorites with ID: {}", request.getMangaId(), favoriteManga.getId());

        // Gửi event đến Kafka
        favoriteEventProducer.sendAddedEvent(request.getMangaId());

        // Tạo response
        FavoriteResponse response = favoriteMangaMapper.toFavoriteResponse(favoriteManga);
        return enrichFavoriteResponse(response, userProfile);
    }

    /**
     * Xóa manga khỏi danh sách yêu thích
     * @param userId ID của người dùng (từ JWT token)
     * @param mangaId ID của manga cần xóa khỏi yêu thích
     */
    @Transactional
    public void removeFavorite(String userId, String mangaId) {
        log.info("Removing manga {} from favorites for user {}", mangaId, userId);

        // Lấy thông tin profile người dùng
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found"));

        String profileId = userProfile.getId();

        // Kiểm tra xem có trong danh sách yêu thích không
        if (!favoriteMangaRepository.existsByUserProfileIdAndMangaId(profileId, mangaId)) {
            log.info("Manga {} not in favorites for user {}", mangaId, userId);
            return;
        }

        // Xóa khỏi danh sách yêu thích
        favoriteMangaRepository.deleteByUserProfileIdAndMangaId(profileId, mangaId);
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

        // Lấy thông tin profile người dùng
        Optional<UserProfile> userProfileOpt = userProfileRepository.findByUserId(userId);
        if (userProfileOpt.isEmpty()) {
            log.info("User profile not found for user {}", userId);
            return false;
        }

        String profileId = userProfileOpt.get().getId();

        // Kiểm tra xem có trong danh sách yêu thích không
        boolean isFavorite = favoriteMangaRepository.existsByUserProfileIdAndMangaId(profileId, mangaId);
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

        // Lấy thông tin profile người dùng
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found"));

        String profileId = userProfile.getId();

        // Lấy danh sách yêu thích
        Page<FavoriteManga> favorites = favoriteMangaRepository.findByUserProfileId(profileId, pageable);
        log.info("Found {} favorites for user {}", favorites.getTotalElements(), userId);

        // Tạo response
        return favorites.map(favorite -> {
            FavoriteResponse response = favoriteMangaMapper.toFavoriteResponse(favorite);
            return enrichFavoriteResponse(response, userProfile);
        });
    }

    /**
     * Bổ sung thông tin cho FavoriteResponse từ Manga Service và UserProfile
     * @param response FavoriteResponse cần bổ sung thông tin
     * @param userProfile Thông tin profile người dùng
     * @return FavoriteResponse đã được bổ sung thông tin
     */
    private FavoriteResponse enrichFavoriteResponse(FavoriteResponse response, UserProfile userProfile) {
        // Bổ sung thông tin người dùng
        response.setUserId(userProfile.getUserId());
        response.setUsername(userProfile.getDisplayName());

        // Bổ sung thông tin manga từ Manga Service
        try {
            ApiResponse<MangaInfoResponse> mangaResponse = mangaClient.getMangaById(response.getMangaId());
            if (mangaResponse != null && mangaResponse.getCode() == 2000 && mangaResponse.getResult() != null) {
                MangaInfoResponse mangaInfo = mangaResponse.getResult();
                response.setMangaTitle(mangaInfo.getTitle());
                response.setMangaCoverUrl(mangaInfo.getCoverUrl());
                response.setAuthor(mangaInfo.getAuthor());
                response.setDescription(mangaInfo.getDescription());
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
}
