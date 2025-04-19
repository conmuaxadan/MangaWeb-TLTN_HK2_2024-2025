package com.raindrop.manga_service.kafka;

import com.raindrop.common.event.CommentEvent;
import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Manga;
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

import java.util.Optional;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CommentEventConsumer {
    MangaRepository mangaRepository;
    ChapterRepository chapterRepository;
    MangaStatsService mangaStatsService;

    /**
     * Xử lý sự kiện comment từ Kafka
     * @param event Sự kiện comment
     */
    @KafkaListener(topics = "manga-comments", groupId = "manga-service")
    @Transactional
    public void consumeCommentEvent(CommentEvent event) {
        log.info("Received comment event: {}", event);

        String mangaId = event.getMangaId();
        String chapterId = event.getChapterId();
        CommentEvent.EventType eventType = event.getEventType();

        // Cập nhật số lượng comment cho chapter nếu có
        if (chapterId != null && !chapterId.isEmpty()) {
            updateChapterCommentCount(chapterId, eventType);
        }

        // Cập nhật số lượng comment cho manga
        updateMangaCommentCount(mangaId, eventType);

        // Cập nhật tổng số comment của manga
        mangaStatsService.updateMangaTotalComments(mangaId);
    }

    /**
     * Cập nhật số lượng comment cho manga
     * @param mangaId ID của manga
     * @param eventType Loại sự kiện (CREATED/DELETED)
     */
    private void updateMangaCommentCount(String mangaId, CommentEvent.EventType eventType) {
        try {
            if (eventType == CommentEvent.EventType.CREATED) {
                int updated = mangaRepository.incrementComments(mangaId);
                if (updated > 0) {
                    log.info("Increased comments for manga {}", mangaId);
                } else {
                    log.error("Manga not found with ID: {}", mangaId);
                }
            } else if (eventType == CommentEvent.EventType.DELETED) {
                int updated = mangaRepository.decrementComments(mangaId);
                if (updated > 0) {
                    log.info("Decreased comments for manga {}", mangaId);
                } else {
                    log.error("Manga not found with ID: {}", mangaId);
                }
            }
        } catch (Exception e) {
            log.error("Error updating comment count for manga {}: {}", mangaId, e.getMessage());
        }
    }

    /**
     * Cập nhật số lượng comment cho chapter
     * @param chapterId ID của chapter
     * @param eventType Loại sự kiện (CREATED/DELETED)
     */
    private void updateChapterCommentCount(String chapterId, CommentEvent.EventType eventType) {
        try {
            if (eventType == CommentEvent.EventType.CREATED) {
                int updated = chapterRepository.incrementComments(chapterId);
                if (updated > 0) {
                    log.info("Increased comments for chapter {}", chapterId);
                } else {
                    log.error("Chapter not found with ID: {}", chapterId);
                }
            } else if (eventType == CommentEvent.EventType.DELETED) {
                int updated = chapterRepository.decrementComments(chapterId);
                if (updated > 0) {
                    log.info("Decreased comments for chapter {}", chapterId);
                } else {
                    log.error("Chapter not found with ID: {}", chapterId);
                }
            }
        } catch (Exception e) {
            log.error("Error updating comment count for chapter {}: {}", chapterId, e.getMessage());
        }
    }
}
