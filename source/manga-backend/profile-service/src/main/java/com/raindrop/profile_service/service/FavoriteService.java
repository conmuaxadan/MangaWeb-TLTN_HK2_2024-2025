package com.raindrop.profile_service.service;

import com.raindrop.profile_service.client.MangaClient;
import com.raindrop.profile_service.dto.response.FavoriteResponse;
import com.raindrop.profile_service.entity.Favorite;
import com.raindrop.profile_service.repository.FavoriteRepository;
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
public class FavoriteService {
    FavoriteRepository favoriteRepository;
    MangaClient mangaClient;
    
    /**
     * Lấy danh sách yêu thích của một người dùng
     */
    public List<FavoriteResponse> getUserFavorites(String userId) {
        log.info("Getting favorites for user: {}", userId);
        List<Favorite> favorites = favoriteRepository.findByUserIdOrderByAddedAtDesc(userId);
        
        return favorites.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Lấy danh sách yêu thích của một người dùng với phân trang
     */
    public Page<FavoriteResponse> getUserFavoritesPaginated(String userId, Pageable pageable) {
        log.info("Getting paginated favorites for user: {}", userId);
        Page<Favorite> favoritesPage = favoriteRepository.findByUserId(userId, pageable);
        
        return favoritesPage.map(this::mapToResponse);
    }
    
    /**
     * Thêm một manga vào danh sách yêu thích
     */
    @Transactional
    public FavoriteResponse addToFavorites(String userId, String mangaId) {
        log.info("Adding manga to favorites for user: {}, manga: {}", userId, mangaId);
        
        try {
            // Kiểm tra xem manga đã có trong danh sách yêu thích chưa
            if (favoriteRepository.existsByUserIdAndMangaId(userId, mangaId)) {
                log.info("Manga already in favorites");
                Favorite existingFavorite = favoriteRepository.findByUserIdAndMangaId(userId, mangaId)
                        .orElseThrow(() -> new RuntimeException("Favorite not found"));
                return mapToResponse(existingFavorite);
            }
            
            // Lấy thông tin manga từ Manga Service
            var mangaResponse = mangaClient.getMangaById(mangaId).getResult();
            
            // Tạo mới favorite
            Favorite favorite = Favorite.builder()
                    .userId(userId)
                    .mangaId(mangaId)
                    .mangaTitle(mangaResponse.title())
                    .mangaCoverUrl(mangaResponse.coverUrl())
                    .build();
            
            // Lưu vào database
            favorite = favoriteRepository.save(favorite);
            
            // Tạo response
            FavoriteResponse response = mapToResponse(favorite);
            response.setAuthor(mangaResponse.author());
            response.setDescription(mangaResponse.description());
            
            return response;
        } catch (Exception e) {
            log.error("Error adding to favorites", e);
            throw new RuntimeException("Failed to add to favorites", e);
        }
    }
    
    /**
     * Kiểm tra xem một manga có trong danh sách yêu thích không
     */
    public boolean isMangaFavorited(String userId, String mangaId) {
        return favoriteRepository.existsByUserIdAndMangaId(userId, mangaId);
    }
    
    /**
     * Xóa một manga khỏi danh sách yêu thích
     */
    @Transactional
    public void removeFromFavorites(String userId, String mangaId) {
        log.info("Removing manga from favorites for user: {}, manga: {}", userId, mangaId);
        favoriteRepository.deleteByUserIdAndMangaId(userId, mangaId);
    }
    
    /**
     * Xóa tất cả manga khỏi danh sách yêu thích
     */
    @Transactional
    public void clearFavorites(String userId) {
        log.info("Clearing all favorites for user: {}", userId);
        favoriteRepository.deleteAllByUserId(userId);
    }
    
    /**
     * Chuyển đổi từ entity sang response
     */
    private FavoriteResponse mapToResponse(Favorite favorite) {
        return FavoriteResponse.builder()
                .id(favorite.getId())
                .userId(favorite.getUserId())
                .mangaId(favorite.getMangaId())
                .mangaTitle(favorite.getMangaTitle())
                .mangaCoverUrl(favorite.getMangaCoverUrl())
                .addedAt(favorite.getAddedAt())
                .build();
    }
}
