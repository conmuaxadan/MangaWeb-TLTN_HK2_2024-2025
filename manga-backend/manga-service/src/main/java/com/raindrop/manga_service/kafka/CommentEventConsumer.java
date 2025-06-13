package com.raindrop.manga_service.kafka;

import com.raindrop.common.event.CommentEvent;
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
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CommentEventConsumer {
    MangaRepository mangaRepository;
    ChapterRepository chapterRepository;
    MangaStatsService mangaStatsService;

    @KafkaListener(topics = "manga-comments", groupId = "manga-service")
    @Transactional
    public void consumeCommentEvent(CommentEvent event) {
        String mangaId = event.getMangaId();
        String chapterId = event.getChapterId();
        CommentEvent.EventType eventType = event.getEventType();

        if (chapterId != null && !chapterId.isEmpty()) {
            updateChapterCommentCount(chapterId, eventType);
        }

        updateMangaCommentCount(mangaId, eventType);
        mangaStatsService.updateMangaTotalComments(mangaId);
    }

    private void updateMangaCommentCount(String mangaId, CommentEvent.EventType eventType) {
        try {
            if (eventType == CommentEvent.EventType.CREATED) {
                mangaRepository.incrementComments(mangaId);
            } else if (eventType == CommentEvent.EventType.DELETED) {
                mangaRepository.decrementComments(mangaId);
            }
        } catch (Exception e) {
            log.error("Error updating manga comment count {}: {}", mangaId, e.getMessage());
        }
    }

    private void updateChapterCommentCount(String chapterId, CommentEvent.EventType eventType) {
        try {
            if (eventType == CommentEvent.EventType.CREATED) {
                chapterRepository.incrementComments(chapterId);
            } else if (eventType == CommentEvent.EventType.DELETED) {
                chapterRepository.decrementComments(chapterId);
            }
        } catch (Exception e) {
            log.error("Error updating chapter comment count {}: {}", chapterId, e.getMessage());
        }
    }
}
