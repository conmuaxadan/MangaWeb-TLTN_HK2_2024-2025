package com.raindrop.manga_service.repository;

import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Manga;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ChapterRepository extends JpaRepository<Chapter, String> {
    Chapter findByTitle(String title);
    Optional<Chapter> findByMangaAndChapterNumber(Manga manga, int chapterNumber);
    Set<Chapter> findByManga(Manga manga);
    List<Chapter> findByMangaId(String mangaId);

    /**
     * Tăng lượt xem của chapter mà không cập nhật thời gian updatedAt
     * @param id ID của chapter
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Chapter c SET c.views = c.views + 1 WHERE c.id = :id")
    int incrementViews(@Param("id") String id);
}
