package com.raindrop.manga_service.repository;

import com.raindrop.manga_service.entity.Genre;
import com.raindrop.manga_service.entity.Manga;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GenreRepository extends JpaRepository<Genre, String> {
    Genre findByName(String name);
}
