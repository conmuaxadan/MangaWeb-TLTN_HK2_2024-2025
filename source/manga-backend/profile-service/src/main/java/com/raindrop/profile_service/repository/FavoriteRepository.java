package com.raindrop.profile_service.repository;

import com.raindrop.profile_service.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, String> {
    /**
     * Tìm danh sách yêu thích của một người dùng, sắp xếp theo thời gian thêm vào giảm dần
     */
    List<Favorite> findByUserIdOrderByAddedAtDesc(String userId);
    
    /**
     * Tìm danh sách yêu thích của một người dùng với phân trang
     */
    Page<Favorite> findByUserId(String userId, Pageable pageable);
    
    /**
     * Tìm một manga cụ thể trong danh sách yêu thích của người dùng
     */
    Optional<Favorite> findByUserIdAndMangaId(String userId, String mangaId);
    
    /**
     * Kiểm tra xem một manga có trong danh sách yêu thích của người dùng không
     */
    boolean existsByUserIdAndMangaId(String userId, String mangaId);
    
    /**
     * Xóa một manga khỏi danh sách yêu thích của người dùng
     */
    @Modifying
    @Query("DELETE FROM Favorite f WHERE f.userId = ?1 AND f.mangaId = ?2")
    void deleteByUserIdAndMangaId(String userId, String mangaId);
    
    /**
     * Xóa tất cả manga khỏi danh sách yêu thích của người dùng
     */
    @Modifying
    @Query("DELETE FROM Favorite f WHERE f.userId = ?1")
    void deleteAllByUserId(String userId);
}
