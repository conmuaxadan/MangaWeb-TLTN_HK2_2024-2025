package com.raindrop.comment_service.kafka;

import com.raindrop.common.event.CommentEvent;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;


@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentEventProducer {
    KafkaTemplate<String, CommentEvent> kafkaTemplate;
    
    private static final String COMMENT_TOPIC = "manga-comments";
    
    public void sendCommentCreatedEvent(String mangaId, String chapterId) {
        CommentEvent event = CommentEvent.builder()
                .mangaId(mangaId)
                .chapterId(chapterId)
                .eventType(CommentEvent.EventType.CREATED)
                .build();

        kafkaTemplate.send(COMMENT_TOPIC, event);
    }

    public void sendCommentDeletedEvent(String mangaId, String chapterId) {
        CommentEvent event = CommentEvent.builder()
                .mangaId(mangaId)
                .chapterId(chapterId)
                .eventType(CommentEvent.EventType.DELETED)
                .build();

        kafkaTemplate.send(COMMENT_TOPIC, event);
    }
}
