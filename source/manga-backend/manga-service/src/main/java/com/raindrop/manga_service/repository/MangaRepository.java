package com.raindrop.manga_service.repository;

import com.raindrop.manga_service.entity.Manga;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MangaRepository extends JpaRepository<Manga, String> {
    Manga findByTitle(String name);
}
