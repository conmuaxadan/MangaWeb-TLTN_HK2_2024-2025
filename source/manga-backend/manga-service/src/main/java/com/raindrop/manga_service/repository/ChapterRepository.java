package com.raindrop.manga_service.repository;

import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Manga;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ChapterRepository extends JpaRepository<Chapter, String> {
    Chapter findByTitle(String title);
    Optional<Chapter> findByMangaAndChapterNumber(Manga manga, int chapterNumber);
    Set<Chapter> findByManga(Manga manga);
    List<Chapter> findByMangaId(String mangaId);
}
