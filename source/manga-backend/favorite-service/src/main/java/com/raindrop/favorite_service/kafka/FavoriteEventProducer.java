package com.raindrop.favorite_service.kafka;

import com.raindrop.common.event.FavoriteEvent;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FavoriteEventProducer {
    KafkaTemplate<String, FavoriteEvent> kafkaTemplate;
    
    private static final String FAVORITE_TOPIC = "manga-favorites";
    
    public void sendAddedEvent(String mangaId) {
        FavoriteEvent event = FavoriteEvent.builder()
                .mangaId(mangaId)
                .eventType(FavoriteEvent.EventType.ADDED)
                .build();

        kafkaTemplate.send(FAVORITE_TOPIC, event);
    }

    public void sendRemovedEvent(String mangaId) {
        FavoriteEvent event = FavoriteEvent.builder()
                .mangaId(mangaId)
                .eventType(FavoriteEvent.EventType.REMOVED)
                .build();

        kafkaTemplate.send(FAVORITE_TOPIC, event);
    }
}
