package com.raindrop.profile_service.kafka;

import com.raindrop.common.event.FavoriteEvent;
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
public class FavoriteEventProducer {
    KafkaTemplate<String, FavoriteEvent> kafkaTemplate;
    
    private static final String FAVORITE_TOPIC = "manga-favorites";
    
    /**
     * Gửi sự kiện thêm yêu thích
     * @param mangaId ID của manga được thêm vào yêu thích
     */
    public void sendAddedEvent(String mangaId) {
        FavoriteEvent event = FavoriteEvent.builder()
                .mangaId(mangaId)
                .eventType(FavoriteEvent.EventType.ADDED)
                .build();
        
        kafkaTemplate.send(FAVORITE_TOPIC, event);
        log.info("Sent ADDED event to Kafka for manga {}", mangaId);
    }
    
    /**
     * Gửi sự kiện xóa yêu thích
     * @param mangaId ID của manga bị xóa khỏi yêu thích
     */
    public void sendRemovedEvent(String mangaId) {
        FavoriteEvent event = FavoriteEvent.builder()
                .mangaId(mangaId)
                .eventType(FavoriteEvent.EventType.REMOVED)
                .build();
        
        kafkaTemplate.send(FAVORITE_TOPIC, event);
        log.info("Sent REMOVED event to Kafka for manga {}", mangaId);
    }
}
