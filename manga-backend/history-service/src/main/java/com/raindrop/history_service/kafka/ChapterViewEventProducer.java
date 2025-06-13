package com.raindrop.history_service.kafka;

import com.raindrop.common.event.ChapterViewEvent;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChapterViewEventProducer {
    KafkaTemplate<String, ChapterViewEvent> kafkaTemplate;
    
    private static final String CHAPTER_VIEW_TOPIC = "chapter-views";
    
    public void sendChapterViewEvent(String chapterId, String mangaId, String userId) {
        ChapterViewEvent event = ChapterViewEvent.builder()
                .chapterId(chapterId)
                .mangaId(mangaId)
                .userId(userId)
                .build();

        kafkaTemplate.send(CHAPTER_VIEW_TOPIC, chapterId, event);
    }
}
