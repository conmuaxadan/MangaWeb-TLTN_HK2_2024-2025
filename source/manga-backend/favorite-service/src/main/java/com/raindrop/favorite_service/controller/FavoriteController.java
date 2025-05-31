package com.raindrop.favorite_service.controller;

import com.raindrop.favorite_service.dto.request.FavoriteRequest;
import com.raindrop.favorite_service.dto.response.ApiResponse;
import com.raindrop.favorite_service.dto.response.FavoriteResponse;
import com.raindrop.favorite_service.service.FavoriteService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
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
public class FavoriteController {
    FavoriteService favoriteService;

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

    @DeleteMapping("/{mangaId}")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String mangaId
    ) {
        String userId = jwt.getSubject();
        favoriteService.removeFavorite(userId, mangaId);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Manga removed from favorites successfully")
                .build());
    }

    @GetMapping("/{mangaId}/check")
    public ResponseEntity<ApiResponse<Boolean>> isFavorite(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String mangaId
    ) {
        String userId = jwt.getSubject();
        boolean isFavorite = favoriteService.isFavorite(userId, mangaId);

        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .message("Favorite status checked successfully")
                .result(isFavorite)
                .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<FavoriteResponse>>> getFavorites(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        String userId = jwt.getSubject();
        Page<FavoriteResponse> favorites = favoriteService.getFavorites(userId, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<FavoriteResponse>>builder()
                .message("Favorites retrieved successfully")
                .result(favorites)
                .build());
    }

    @GetMapping("/{mangaId}/count")
    public ResponseEntity<ApiResponse<Long>> countFavorites(@PathVariable String mangaId) {
        long count = favoriteService.countFavoritesByMangaId(mangaId);

        return ResponseEntity.ok(ApiResponse.<Long>builder()
                .message("Favorites counted successfully")
                .result(count)
                .build());
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> countTotalFavorites() {
        long count = favoriteService.countTotalFavorites();

        return ResponseEntity.ok(ApiResponse.<Long>builder()
                .message("Total favorites counted successfully")
                .result(count)
                .build());
    }

    @GetMapping("/count/today")
    public ResponseEntity<ApiResponse<Long>> countTodayFavorites() {
        long count = favoriteService.countTodayFavorites();

        return ResponseEntity.ok(ApiResponse.<Long>builder()
                .message("Today's favorites counted successfully")
                .result(count)
                .build());
    }
}
