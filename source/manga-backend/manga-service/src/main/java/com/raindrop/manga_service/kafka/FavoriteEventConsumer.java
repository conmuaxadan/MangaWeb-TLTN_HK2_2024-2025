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
    
    /**
     * Xử lý sự kiện yêu thích từ Kafka
     * @param event Sự kiện yêu thích
     */
    @KafkaListener(topics = "manga-favorites", groupId = "manga-service")
    @Transactional
    public void consumeFavoriteEvent(FavoriteEvent event) {
        log.info("Received favorite event: {}", event);
        
        String mangaId = event.getMangaId();
        FavoriteEvent.EventType eventType = event.getEventType();
        
        // Tìm manga
        Manga manga = mangaRepository.findById(mangaId)
                .orElseThrow(() -> {
                    log.error("Manga not found with ID: {}", mangaId);
                    return new RuntimeException("Manga not found");
                });
        
        // Cập nhật số lượng yêu thích
        if (eventType == FavoriteEvent.EventType.ADDED) {
            manga.setLoves(manga.getLoves() + 1);
            log.info("Increased loves for manga {}: {}", mangaId, manga.getLoves());
        } else if (eventType == FavoriteEvent.EventType.REMOVED) {
            // Đảm bảo loves không âm
            if (manga.getLoves() > 0) {
                manga.setLoves(manga.getLoves() - 1);
                log.info("Decreased loves for manga {}: {}", mangaId, manga.getLoves());
            }
        }
        
        // Lưu manga
        mangaRepository.save(manga);
    }
}
