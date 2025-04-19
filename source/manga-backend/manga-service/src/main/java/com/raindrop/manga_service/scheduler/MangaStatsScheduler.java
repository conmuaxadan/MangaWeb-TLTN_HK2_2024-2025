package com.raindrop.manga_service.scheduler;

import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.repository.MangaRepository;
import com.raindrop.manga_service.service.MangaStatsService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class MangaStatsScheduler {
    MangaRepository mangaRepository;
    MangaStatsService mangaStatsService;
    
    /**
     * Cập nhật tổng số lượt xem và comment của tất cả manga mỗi ngày lúc 3 giờ sáng
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void updateAllMangaStats() {
        log.info("Starting scheduled update of manga stats");
        
        List<Manga> allManga = mangaRepository.findAll();
        log.info("Found {} manga to update", allManga.size());
        
        int successCount = 0;
        for (Manga manga : allManga) {
            try {
                mangaStatsService.updateMangaTotalViews(manga.getId());
                mangaStatsService.updateMangaTotalComments(manga.getId());
                successCount++;
            } catch (Exception e) {
                log.error("Error updating stats for manga {}: {}", manga.getId(), e.getMessage());
            }
        }
        
        log.info("Completed scheduled update of manga stats. Success: {}/{}", successCount, allManga.size());
    }
}
