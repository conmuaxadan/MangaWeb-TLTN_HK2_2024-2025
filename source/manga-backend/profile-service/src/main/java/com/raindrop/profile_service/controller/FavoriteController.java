package com.raindrop.profile_service.controller;

import com.raindrop.profile_service.dto.response.ApiResponse;
import com.raindrop.profile_service.dto.response.FavoriteResponse;
import com.raindrop.profile_service.service.FavoriteService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/{userId}/favorites")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class FavoriteController {
    FavoriteService favoriteService;
    
    /**
     * Lấy danh sách yêu thích của một người dùng
     */
    @GetMapping
    public ApiResponse<List<FavoriteResponse>> getUserFavorites(
            @PathVariable String userId) {
        log.info("GET request to get favorites for user: {}", userId);
        return ApiResponse.<List<FavoriteResponse>>builder()
                .message("Favorites retrieved successfully")
                .result(favoriteService.getUserFavorites(userId))
                .build();
    }
    
    /**
     * Lấy danh sách yêu thích của một người dùng với phân trang
     */
    @GetMapping("/paginated")
    public ApiResponse<Page<FavoriteResponse>> getUserFavoritesPaginated(
            @PathVariable String userId,
            @PageableDefault(size = 10, sort = "addedAt") Pageable pageable) {
        log.info("GET request to get paginated favorites for user: {}", userId);
        return ApiResponse.<Page<FavoriteResponse>>builder()
                .message("Favorites retrieved successfully")
                .result(favoriteService.getUserFavoritesPaginated(userId, pageable))
                .build();
    }
    
    /**
     * Thêm một manga vào danh sách yêu thích
     */
    @PostMapping("/{mangaId}")
    public ApiResponse<FavoriteResponse> addToFavorites(
            @PathVariable String userId,
            @PathVariable String mangaId) {
        log.info("POST request to add manga to favorites for user: {}, manga: {}", userId, mangaId);
        return ApiResponse.<FavoriteResponse>builder()
                .message("Added to favorites successfully")
                .result(favoriteService.addToFavorites(userId, mangaId))
                .build();
    }
    
    /**
     * Kiểm tra xem một manga có trong danh sách yêu thích không
     */
    @GetMapping("/{mangaId}/check")
    public ApiResponse<Boolean> isMangaFavorited(
            @PathVariable String userId,
            @PathVariable String mangaId) {
        log.info("GET request to check if manga is favorited for user: {}, manga: {}", userId, mangaId);
        return ApiResponse.<Boolean>builder()
                .message("Favorite status checked successfully")
                .result(favoriteService.isMangaFavorited(userId, mangaId))
                .build();
    }
    
    /**
     * Xóa một manga khỏi danh sách yêu thích
     */
    @DeleteMapping("/{mangaId}")
    public ApiResponse<Void> removeFromFavorites(
            @PathVariable String userId,
            @PathVariable String mangaId) {
        log.info("DELETE request to remove manga from favorites for user: {}, manga: {}", userId, mangaId);
        favoriteService.removeFromFavorites(userId, mangaId);
        return ApiResponse.<Void>builder()
                .message("Removed from favorites successfully")
                .build();
    }
    
    /**
     * Xóa tất cả manga khỏi danh sách yêu thích
     */
    @DeleteMapping
    public ApiResponse<Void> clearFavorites(
            @PathVariable String userId) {
        log.info("DELETE request to clear all favorites for user: {}", userId);
        favoriteService.clearFavorites(userId);
        return ApiResponse.<Void>builder()
                .message("All favorites cleared successfully")
                .build();
    }
}
