package com.raindrop.profile_service.kafka;

import com.raindrop.common.event.ChapterNotificationEvent;
import com.raindrop.common.event.NewChapterEvent;
import com.raindrop.profile_service.entity.UserProfile;
import com.raindrop.profile_service.repository.FavoriteMangaRepository;
import com.raindrop.profile_service.repository.UserProfileRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NewChapterEventConsumer {
    FavoriteMangaRepository favoriteMangaRepository;
    UserProfileRepository userProfileRepository;
    KafkaTemplate<String, ChapterNotificationEvent> kafkaTemplate;

    private static final String CHAPTER_NOTIFICATION_TOPIC = "chapter-notifications";

    @KafkaListener(topics = "manga-new-chapters", groupId = "profile-service")
    public void consume(NewChapterEvent event) {
        log.info("Received NEW_CHAPTER event for manga: {}, chapter: {}", event.getMangaTitle(), event.getChapterTitle());

        try {
            // Lấy danh sách userId của người dùng đã yêu thích truyện
            List<String> userIds = favoriteMangaRepository.findUserIdsByMangaId(event.getMangaId());

            if (userIds.isEmpty()) {
                log.info("No users have favorited manga: {}", event.getMangaTitle());
                return;
            }

            log.info("Found {} users who favorited manga: {}", userIds.size(), event.getMangaTitle());

            // Lấy thông tin email của từng người dùng và gửi thông báo
            for (String userId : userIds) {
                UserProfile userProfile = userProfileRepository.findByUserId(userId)
                        .orElse(null);

                if (userProfile == null || userProfile.getEmail() == null) {
                    log.warn("User profile or email not found for userId: {}", userId);
                    continue;
                }

                // Tạo và gửi sự kiện thông báo cho từng người dùng
                ChapterNotificationEvent notificationEvent = ChapterNotificationEvent.builder()
                        .mangaId(event.getMangaId())
                        .mangaTitle(event.getMangaTitle())
                        .chapterId(event.getChapterId())
                        .chapterNumber(event.getChapterNumber())
                        .chapterTitle(event.getChapterTitle())
                        .userEmail(userProfile.getEmail())
                        .build();

                // Gửi sự kiện thông báo đến Kafka
                kafkaTemplate.send(CHAPTER_NOTIFICATION_TOPIC, userId, notificationEvent);
                log.info("Sent notification event to Kafka for user: {}, email: {}", userId, userProfile.getEmail());
            }
        } catch (Exception e) {
            log.error("Error processing NEW_CHAPTER event: {}", e.getMessage(), e);
        }
    }
}
