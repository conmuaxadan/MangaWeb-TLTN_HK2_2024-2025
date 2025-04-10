package com.raindrop.profile_service.repository;

import com.raindrop.profile_service.entity.MangaInfo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MangaInfoRepository extends JpaRepository<MangaInfo, String> {
}
