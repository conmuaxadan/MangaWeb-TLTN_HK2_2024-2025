package com.raindrop.manga_service.service;

import com.raindrop.manga_service.repository.ChapterRepository;
import com.raindrop.manga_service.repository.MangaRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class MangaStatsService {
    ChapterRepository chapterRepository;
    MangaRepository mangaRepository;

    @Transactional
    public void updateMangaTotalViews(String mangaId) {
        try {
            Integer totalViews = chapterRepository.sumViewsByMangaId(mangaId);
            if (totalViews == null) {
                totalViews = 0;
            }
            mangaRepository.updateTotalViews(mangaId, totalViews);
        } catch (Exception e) {
            log.error("Error updating total views for manga {}: {}", mangaId, e.getMessage());
        }
    }

    @Transactional
    public void updateMangaTotalComments(String mangaId) {
        try {
            Integer totalComments = chapterRepository.sumCommentsByMangaId(mangaId);
            if (totalComments == null) {
                totalComments = 0;
            }
            mangaRepository.updateTotalComments(mangaId, totalComments);
        } catch (Exception e) {
            log.error("Error updating total comments for manga {}: {}", mangaId, e.getMessage());
        }
    }
}
