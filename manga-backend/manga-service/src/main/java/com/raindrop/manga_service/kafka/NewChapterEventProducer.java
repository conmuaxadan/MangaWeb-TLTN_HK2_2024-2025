package com.raindrop.manga_service.kafka;

import com.raindrop.common.event.NewChapterEvent;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NewChapterEventProducer {
    KafkaTemplate<String, NewChapterEvent> kafkaTemplate;

    private static final String NEW_CHAPTER_TOPIC = "manga-new-chapter";

    public void sendNewChapterEvent(String mangaId, String mangaTitle, String chapterId, double chapterNumber, String chapterTitle) {
        NewChapterEvent event = NewChapterEvent.builder()
                .mangaId(mangaId)
                .mangaTitle(mangaTitle)
                .chapterId(chapterId)
                .chapterNumber(chapterNumber)
                .chapterTitle(chapterTitle)
                .build();

        kafkaTemplate.send(NEW_CHAPTER_TOPIC, mangaId, event);
    }
}
