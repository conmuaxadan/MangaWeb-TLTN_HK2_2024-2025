package com.raindrop.favorite_service.kafka;

import com.raindrop.common.event.ChapterNotificationEvent;
import com.raindrop.common.event.NewChapterEvent;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NewChapterEventProducer {
    KafkaTemplate<String, ChapterNotificationEvent> kafkaTemplate;

    private static final String NEW_CHAPTER_TOPIC = "manga-new-chapter-notification";

    public void sendNewChapterEvent(String mangaId, String mangaTitle, String chapterId, double chapterNumber, String chapterTitle, String userEmail, String displayName) {
        ChapterNotificationEvent event = ChapterNotificationEvent.builder()
                .mangaId(mangaId)
                .mangaTitle(mangaTitle)
                .chapterId(chapterId)
                .userEmail(userEmail)
                .chapterNumber(chapterNumber)
                .chapterTitle(chapterTitle)
                .displayName(displayName)
                .build();

        kafkaTemplate.send(NEW_CHAPTER_TOPIC, mangaId, event);
    }
}
