package com.raindrop.manga_service.kafka;

import com.raindrop.common.event.ChapterViewEvent;
import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.enums.ErrorCode;
import com.raindrop.manga_service.exception.AppException;
import com.raindrop.manga_service.repository.ChapterRepository;
import com.raindrop.manga_service.repository.MangaRepository;
import com.raindrop.manga_service.service.MangaStatsService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChapterViewEventConsumer {
    ChapterRepository chapterRepository;
    MangaRepository mangaRepository;
    MangaStatsService mangaStatsService;

    @KafkaListener(topics = "chapter-views", groupId = "manga-service")
    @Transactional
    public void consumeChapterViewEvent(ChapterViewEvent event) {
        String chapterId = event.getChapterId();
        String mangaId = event.getMangaId();
        String userId = event.getUserId();
        
        log.info("Received CHAPTER_VIEW event for chapter: {}, manga: {}, user: {}", 
                chapterId, mangaId, userId != null ? userId : "anonymous");
        
        try {
            // Tìm chapter
            Chapter chapter = chapterRepository.findById(chapterId)
                    .orElseThrow(() -> {
                        log.error("Chapter not found with ID: {}", chapterId);
                        return new AppException(ErrorCode.CHAPTER_NOT_FOUND);
                    });
            
            // Tăng lượt xem của chapter
            chapterRepository.incrementViews(chapterId);
            log.info("Incremented views for chapter: {}", chapterId);

            // Cập nhật tổng số lượt xem của manga
            mangaStatsService.updateMangaTotalViews(mangaId);
            log.info("Updated total views for manga: {}", mangaId);
            
        } catch (Exception e) {
            log.error("Error processing CHAPTER_VIEW event", e);
        }
    }
}
