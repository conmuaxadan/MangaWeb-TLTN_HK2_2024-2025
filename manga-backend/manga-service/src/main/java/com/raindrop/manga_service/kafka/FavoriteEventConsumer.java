package com.raindrop.manga_service.kafka;

import com.raindrop.common.event.FavoriteEvent;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.repository.MangaRepository;
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
public class FavoriteEventConsumer {
    MangaRepository mangaRepository;

    @KafkaListener(topics = "manga-favorites", groupId = "manga-service")
    @Transactional
    public void consumeFavoriteEvent(FavoriteEvent event) {
        String mangaId = event.getMangaId();
        FavoriteEvent.EventType eventType = event.getEventType();

        Manga manga = mangaRepository.findById(mangaId)
                .orElseThrow(() -> new RuntimeException("Manga not found"));

        if (eventType == FavoriteEvent.EventType.ADDED) {
            manga.setLoves(manga.getLoves() + 1);
        } else if (eventType == FavoriteEvent.EventType.REMOVED) {
            if (manga.getLoves() > 0) {
                manga.setLoves(manga.getLoves() - 1);
            }
        }
        mangaRepository.save(manga);
    }
}
