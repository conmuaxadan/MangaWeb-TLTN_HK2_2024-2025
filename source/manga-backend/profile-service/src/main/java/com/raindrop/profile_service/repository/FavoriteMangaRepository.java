package com.raindrop.profile_service.repository;

import com.raindrop.profile_service.entity.FavoriteManga;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteMangaRepository extends JpaRepository<FavoriteManga, String> {
    List<FavoriteManga> findByProfileId(String profileId);
    Page<FavoriteManga> findByProfileId(String profileId, Pageable pageable);
    Optional<FavoriteManga> findByProfileIdAndMangaId(String profileId, String mangaId);
    boolean existsByProfileIdAndMangaId(String profileId, String mangaId);
    void deleteByProfileIdAndMangaId(String profileId, String mangaId);
    long countByMangaId(String mangaId);
}
