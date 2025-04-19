package com.raindrop.profile_service.repository;

import com.raindrop.profile_service.entity.FavoriteManga;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteMangaRepository extends JpaRepository<FavoriteManga, String> {
    List<FavoriteManga> findByUserProfileId(String profileId);
    Page<FavoriteManga> findByUserProfileId(String profileId, Pageable pageable);
    Optional<FavoriteManga> findByUserProfileIdAndMangaId(String profileId, String mangaId);
    boolean existsByUserProfileIdAndMangaId(String profileId, String mangaId);
    void deleteByUserProfileIdAndMangaId(String profileId, String mangaId);
    long countByMangaId(String mangaId);
}
