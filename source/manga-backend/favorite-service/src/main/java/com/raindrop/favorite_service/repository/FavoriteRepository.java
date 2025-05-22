package com.raindrop.favorite_service.repository;

import com.raindrop.favorite_service.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, String> {
    List<Favorite> findByUserId(String userId);
    Page<Favorite> findByUserId(String userId, Pageable pageable);
    Optional<Favorite> findByUserIdAndMangaId(String userId, String mangaId);
    boolean existsByUserIdAndMangaId(String userId, String mangaId);
    void deleteByUserIdAndMangaId(String userId, String mangaId);
    long countByMangaId(String mangaId);

    /**
     * Lấy danh sách userId của người dùng đã yêu thích truyện
     * @param mangaId ID của manga
     * @return Danh sách userId của người dùng
     */
    @Query("SELECT f.userId FROM Favorite f WHERE f.mangaId = :mangaId")
    List<String> findUserIdsByMangaId(@Param("mangaId") String mangaId);

    /**
     * Đếm tổng số yêu thích trong hệ thống
     * @return Tổng số yêu thích
     */
    @Query("SELECT COUNT(f) FROM Favorite f")
    long countTotalFavorites();

    /**
     * Đếm số yêu thích mới trong ngày hôm nay
     * @return Số yêu thích mới trong ngày
     */
    @Query("SELECT COUNT(f) FROM Favorite f WHERE DATE(f.createdAt) = CURRENT_DATE")
    long countTodayFavorites();
}
