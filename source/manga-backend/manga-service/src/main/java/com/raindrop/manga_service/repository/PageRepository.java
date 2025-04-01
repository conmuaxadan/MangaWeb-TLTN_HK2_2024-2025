package com.raindrop.manga_service.repository;

import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Page;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PageRepository extends JpaRepository<Page, String> {
}
