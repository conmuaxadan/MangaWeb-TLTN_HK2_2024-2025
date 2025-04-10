package com.raindrop.profile_service.repository;

import com.raindrop.profile_service.entity.ReadingHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReadingHistoryRepository extends JpaRepository<ReadingHistory, String> {
    List<ReadingHistory> findByUserId(String userId);
    Page<ReadingHistory> findByUserId(String userId, Pageable pageable);
    List<ReadingHistory> findByUserIdAndMangaId(String userId, String mangaId);
    Optional<ReadingHistory> findByUserIdAndMangaIdAndChapterId(String userId, String mangaId, String chapterId);
    void deleteByUserIdAndId(String userId, String historyId);
    void deleteByUserId(String userId);
}
