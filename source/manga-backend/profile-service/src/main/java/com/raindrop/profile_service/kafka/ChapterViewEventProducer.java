package com.raindrop.profile_service.kafka;

import com.raindrop.common.event.ChapterViewEvent;
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
public class ChapterViewEventProducer {
    KafkaTemplate<String, ChapterViewEvent> kafkaTemplate;
    
    private static final String CHAPTER_VIEW_TOPIC = "chapter-views";
    
    /**
     * Gửi sự kiện xem chapter
     * @param chapterId ID của chapter
     * @param mangaId ID của manga
     * @param userId ID của người dùng (có thể null)
     */
    public void sendChapterViewEvent(String chapterId, String mangaId, String userId) {
        ChapterViewEvent event = ChapterViewEvent.builder()
                .chapterId(chapterId)
                .mangaId(mangaId)
                .userId(userId)
                .build();
        
        kafkaTemplate.send(CHAPTER_VIEW_TOPIC, chapterId, event);
        log.info("Sent CHAPTER_VIEW event to Kafka for chapter: {}, manga: {}, user: {}", 
                chapterId, mangaId, userId != null ? userId : "anonymous");
    }
}
