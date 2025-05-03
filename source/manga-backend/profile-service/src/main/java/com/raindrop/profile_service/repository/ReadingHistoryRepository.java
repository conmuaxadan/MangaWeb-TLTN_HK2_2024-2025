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

    /**
     * Lấy tất cả mangaId đã đọc của người dùng
     * @param profileId ID của profile người dùng
     * @return Danh sách tất cả mangaId đã đọc
     */
    @Query(value = "SELECT DISTINCT manga_id FROM reading_histories WHERE profile_id = :profileId", nativeQuery = true)
    List<String> findAllMangaIdsByUserProfileId(@Param("profileId") String profileId);

    /**
     * Lấy danh sách mangaId gần đây của người dùng, mỗi manga chỉ lấy 1 lần
     * @param profileId ID của profile người dùng
     * @param limit Số lượng mangaId cần lấy
     * @return Danh sách mangaId gần đây
     */
    @Query(value = "SELECT DISTINCT rh.manga_id FROM reading_histories rh " +
            "WHERE rh.profile_id = :profileId " +
            "ORDER BY MAX(rh.updated_at) DESC LIMIT :limit", nativeQuery = true)
    List<String> findRecentMangaIdsByUserProfileId(@Param("profileId") String profileId, @Param("limit") int limit);
}
