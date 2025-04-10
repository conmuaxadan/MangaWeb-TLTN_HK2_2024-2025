package com.raindrop.profile_service.repository;

import com.raindrop.profile_service.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, String> {
    List<Favorite> findByUserId(String userId);
    Page<Favorite> findByUserId(String userId, Pageable pageable);
    Optional<Favorite> findByUserIdAndMangaId(String userId, String mangaId);
    boolean existsByUserIdAndMangaId(String userId, String mangaId);
    void deleteByUserIdAndMangaId(String userId, String mangaId);
    void deleteByUserId(String userId);
}
