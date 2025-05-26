package com.raindrop.favorite_service.controller;

import com.raindrop.favorite_service.dto.request.FavoriteRequest;
import com.raindrop.favorite_service.dto.response.ApiResponse;
import com.raindrop.favorite_service.dto.response.FavoriteResponse;
import com.raindrop.favorite_service.service.FavoriteService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class FavoriteController {
    FavoriteService favoriteService;

    /**
     * Thêm manga vào danh sách yêu thích
     * @param jwt JWT token của người dùng
     * @param request Thông tin manga cần thêm vào yêu thích
     * @return Thông tin manga đã thêm vào yêu thích
     */
    @PostMapping
    public ResponseEntity<ApiResponse<FavoriteResponse>> addFavorite(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody FavoriteRequest request
    ) {
        String userId = jwt.getSubject();
        FavoriteResponse response = favoriteService.addFavorite(userId, request);

        return ResponseEntity.ok(ApiResponse.<FavoriteResponse>builder()
                .code(201)
                .message("Manga added to favorites successfully")
                .result(response)
                .build());
    }

    /**
     * Xóa manga khỏi danh sách yêu thích
     * @param jwt JWT token của người dùng
     * @param mangaId ID của manga cần xóa khỏi yêu thích
     * @return Thông báo xóa thành công
     */
    @DeleteMapping("/{mangaId}")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String mangaId
    ) {
        String userId = jwt.getSubject();
        log.info("Removing manga {} from favorites for user {}", mangaId, userId);

        favoriteService.removeFavorite(userId, mangaId);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Manga removed from favorites successfully")
                .build());
    }

    /**
     * Kiểm tra xem manga có trong danh sách yêu thích của người dùng không
     * @param jwt JWT token của người dùng
     * @param mangaId ID của manga cần kiểm tra
     * @return true nếu manga có trong danh sách yêu thích, false nếu không
     */
    @GetMapping("/{mangaId}/check")
    public ResponseEntity<ApiResponse<Boolean>> isFavorite(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String mangaId
    ) {
        String userId = jwt.getSubject();
        log.info("Checking if manga {} is in favorites for user {}", mangaId, userId);

        boolean isFavorite = favoriteService.isFavorite(userId, mangaId);

        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .message("Favorite status checked successfully")
                .result(isFavorite)
                .build());
    }

    /**
     * Lấy danh sách manga yêu thích của người dùng
     * @param jwt JWT token của người dùng
     * @param pageable Thông tin phân trang
     * @return Danh sách manga yêu thích có phân trang
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<FavoriteResponse>>> getFavorites(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        String userId = jwt.getSubject();
        log.info("Getting favorites for user {}", userId);

        Page<FavoriteResponse> favorites = favoriteService.getFavorites(userId, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<FavoriteResponse>>builder()
                .message("Favorites retrieved successfully")
                .result(favorites)
                .build());
    }

    /**
     * Đếm số lượng yêu thích của một manga
     * @param mangaId ID của manga
     * @return Số lượng yêu thích
     */
    @GetMapping("/{mangaId}/count")
    public ResponseEntity<ApiResponse<Long>> countFavorites(@PathVariable String mangaId) {
        log.info("Counting favorites for manga {}", mangaId);

        long count = favoriteService.countFavoritesByMangaId(mangaId);

        return ResponseEntity.ok(ApiResponse.<Long>builder()
                .message("Favorites counted successfully")
                .result(count)
                .build());
    }

    /**
     * Đếm tổng số yêu thích trong hệ thống
     * @return Tổng số yêu thích
     */
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> countTotalFavorites() {
        log.info("Counting total favorites");

        long count = favoriteService.countTotalFavorites();

        return ResponseEntity.ok(ApiResponse.<Long>builder()
                .message("Total favorites counted successfully")
                .result(count)
                .build());
    }

    /**
     * Đếm số yêu thích mới trong ngày hôm nay
     * @return Số yêu thích mới trong ngày
     */
    @GetMapping("/count/today")
    public ResponseEntity<ApiResponse<Long>> countTodayFavorites() {
        log.info("Counting today's favorites");

        long count = favoriteService.countTodayFavorites();

        return ResponseEntity.ok(ApiResponse.<Long>builder()
                .message("Today's favorites counted successfully")
                .result(count)
                .build());
    }
}
