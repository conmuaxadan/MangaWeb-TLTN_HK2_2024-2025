package com.raindrop.profile_service.kafka;

import com.raindrop.common.event.CommentEvent;
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
public class CommentEventProducer {
    KafkaTemplate<String, CommentEvent> kafkaTemplate;
    
    private static final String COMMENT_TOPIC = "manga-comments";
    
    /**
     * Gửi sự kiện tạo comment
     * @param mangaId ID của manga
     * @param chapterId ID của chapter
     */
    public void sendCommentCreatedEvent(String mangaId, String chapterId) {
        CommentEvent event = CommentEvent.builder()
                .mangaId(mangaId)
                .chapterId(chapterId)
                .eventType(CommentEvent.EventType.CREATED)
                .build();
        
        kafkaTemplate.send(COMMENT_TOPIC, event);
        log.info("Sent CREATED comment event to Kafka for manga: {}, chapter: {}", mangaId, chapterId);
    }
    
    /**
     * Gửi sự kiện xóa comment
     * @param mangaId ID của manga
     * @param chapterId ID của chapter
     */
    public void sendCommentDeletedEvent(String mangaId, String chapterId) {
        CommentEvent event = CommentEvent.builder()
                .mangaId(mangaId)
                .chapterId(chapterId)
                .eventType(CommentEvent.EventType.DELETED)
                .build();
        
        kafkaTemplate.send(COMMENT_TOPIC, event);
        log.info("Sent DELETED comment event to Kafka for manga: {}, chapter: {}", mangaId, chapterId);
    }
}
