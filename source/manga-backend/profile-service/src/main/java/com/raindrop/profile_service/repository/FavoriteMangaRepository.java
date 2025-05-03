package com.raindrop.profile_service.repository;

import com.raindrop.profile_service.entity.FavoriteManga;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteMangaRepository extends JpaRepository<FavoriteManga, String> {
    List<FavoriteManga> findByUserProfileId(String profileId);
    Page<FavoriteManga> findByUserProfileId(String profileId, Pageable pageable);
    Optional<FavoriteManga> findByUserProfileIdAndMangaId(String profileId, String mangaId);
    boolean existsByUserProfileIdAndMangaId(String profileId, String mangaId);
    void deleteByUserProfileIdAndMangaId(String profileId, String mangaId);
    long countByMangaId(String mangaId);

    /**
     * Lấy danh sách userId của người dùng đã yêu thích truyện
     * @param mangaId ID của manga
     * @return Danh sách userId của người dùng
     */
    @Query("SELECT up.userId FROM FavoriteManga fm JOIN fm.userProfile up WHERE fm.mangaId = :mangaId")
    List<String> findUserIdsByMangaId(@Param("mangaId") String mangaId);
}
