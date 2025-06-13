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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FavoriteService {
    FavoriteRepository favoriteMangaRepository;
    FavoriteMapper favoriteMangaMapper;
    MangaClient mangaClient;
    FavoriteEventProducer favoriteEventProducer;

    @Transactional
    public FavoriteResponse addFavorite(String userId, FavoriteRequest request) {
        // Kiểm tra xem đã thêm vào yêu thích chưa
        if (favoriteMangaRepository.existsByUserIdAndMangaId(userId, request.getMangaId())) {
            Favorite existingFavorite = favoriteMangaRepository.findByUserIdAndMangaId(userId, request.getMangaId())
                    .orElseThrow(() -> new RuntimeException("Favorite manga not found"));

            return enrichFavoriteResponse(favoriteMangaMapper.toFavoriteResponse(existingFavorite), userId);
        }

        // Tạo mới favorite
        Favorite favorite = favoriteMangaMapper.toFavorite(request);
        favorite.setUserId(userId);

        favorite = favoriteMangaRepository.save(favorite);

        // Gửi event đến Kafka
        favoriteEventProducer.sendAddedEvent(request.getMangaId());

        // Tạo response
        FavoriteResponse response = favoriteMangaMapper.toFavoriteResponse(favorite);
        return enrichFavoriteResponse(response, userId);
    }

    @Transactional
    public void removeFavorite(String userId, String mangaId) {
        // Kiểm tra xem có trong danh sách yêu thích không
        if (!favoriteMangaRepository.existsByUserIdAndMangaId(userId, mangaId)) {
            return;
        }

        // Xóa khỏi danh sách yêu thích
        favoriteMangaRepository.deleteByUserIdAndMangaId(userId, mangaId);

        // Gửi event đến Kafka
        favoriteEventProducer.sendRemovedEvent(mangaId);
    }

    public boolean isFavorite(String userId, String mangaId) {
        // Kiểm tra xem có trong danh sách yêu thích không
        boolean isFavorite = favoriteMangaRepository.existsByUserIdAndMangaId(userId, mangaId);
        return isFavorite;
    }

    public Page<FavoriteResponse> getFavorites(String userId, Pageable pageable) {
        // Lấy danh sách yêu thích
        Page<Favorite> favorites = favoriteMangaRepository.findByUserId(userId, pageable);

        // Tạo response
        return favorites.map(favorite -> {
            FavoriteResponse response = favoriteMangaMapper.toFavoriteResponse(favorite);
            return enrichFavoriteResponse(response, userId);
        });
    }

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
            // Silent error handling
        }

        return response;
    }

    public long countFavoritesByMangaId(String mangaId) {
        return favoriteMangaRepository.countByMangaId(mangaId);
    }

    public long countTotalFavorites() {
        return favoriteMangaRepository.countTotalFavorites();
    }

    public long countTodayFavorites() {
        return favoriteMangaRepository.countTodayFavorites();
    }

    public List<String> userIdsByMangaId(String mangaId) {
        return favoriteMangaRepository.findUserIdsByMangaId(mangaId);
    }


}
