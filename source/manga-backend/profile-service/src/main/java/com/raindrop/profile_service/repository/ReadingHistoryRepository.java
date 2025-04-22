package com.raindrop.profile_service.repository;

import com.raindrop.profile_service.entity.ReadingHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReadingHistoryRepository extends JpaRepository<ReadingHistory, String> {
    Page<ReadingHistory> findByUserProfileId(String profileId, Pageable pageable);

    @Query("SELECT rh FROM ReadingHistory rh WHERE rh.userProfile.id = :profileId GROUP BY rh.mangaId ORDER BY MAX(rh.updatedAt) DESC")
    Page<ReadingHistory> findLatestByUserProfileIdGroupByManga(@Param("profileId") String profileId, Pageable pageable);

    Optional<ReadingHistory> findByUserProfileIdAndMangaIdAndChapterId(String profileId, String mangaId, String chapterId);

    Optional<ReadingHistory> findFirstByUserProfileIdAndMangaIdOrderByUpdatedAtDesc(String profileId, String mangaId);

    List<ReadingHistory> findByMangaId(String mangaId);

    List<ReadingHistory> findByUserProfileIdOrderByUpdatedAtDesc(String profileId);
}
