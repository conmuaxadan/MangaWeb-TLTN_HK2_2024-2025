package com.raindrop.manga_service.repository;

import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Manga;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChapterRepository extends JpaRepository<Chapter, String> {
    Chapter findByTitle(String title);
    List<Chapter> findByManga(Manga manga);
    Optional<Chapter> findByMangaAndChapterNumber(Manga manga, int chapterNumber);
}
