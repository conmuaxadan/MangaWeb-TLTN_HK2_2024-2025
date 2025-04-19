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
    
    /**
     * Cập nhật tổng số lượt xem của manga
     * @param mangaId ID của manga
     */
    @Transactional
    public void updateMangaTotalViews(String mangaId) {
        log.info("Updating total views for manga: {}", mangaId);
        
        try {
            Integer totalViews = chapterRepository.sumViewsByMangaId(mangaId);
            
            // Nếu không có chapter nào, đặt tổng số lượt xem là 0
            if (totalViews == null) {
                totalViews = 0;
            }
            
            int updated = mangaRepository.updateTotalViews(mangaId, totalViews);
            
            if (updated > 0) {
                log.info("Updated total views for manga {}: {}", mangaId, totalViews);
            } else {
                log.error("Failed to update total views for manga: {}", mangaId);
            }
        } catch (Exception e) {
            log.error("Error updating total views for manga {}: {}", mangaId, e.getMessage());
        }
    }
    
    /**
     * Cập nhật tổng số comment của manga
     * @param mangaId ID của manga
     */
    @Transactional
    public void updateMangaTotalComments(String mangaId) {
        log.info("Updating total comments for manga: {}", mangaId);
        
        try {
            Integer totalComments = chapterRepository.sumCommentsByMangaId(mangaId);
            
            // Nếu không có chapter nào, đặt tổng số comment là 0
            if (totalComments == null) {
                totalComments = 0;
            }
            
            int updated = mangaRepository.updateTotalComments(mangaId, totalComments);
            
            if (updated > 0) {
                log.info("Updated total comments for manga {}: {}", mangaId, totalComments);
            } else {
                log.error("Failed to update total comments for manga: {}", mangaId);
            }
        } catch (Exception e) {
            log.error("Error updating total comments for manga {}: {}", mangaId, e.getMessage());
        }
    }
}
