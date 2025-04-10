package com.raindrop.profile_service.repository;

import com.raindrop.profile_service.entity.ChapterInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChapterInfoRepository extends JpaRepository<ChapterInfo, String> {
    List<ChapterInfo> findByMangaId(String mangaId);
}
