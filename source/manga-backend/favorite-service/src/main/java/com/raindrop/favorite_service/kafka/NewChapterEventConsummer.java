package com.raindrop.favorite_service.kafka;

import com.raindrop.common.event.NewChapterEvent;
import com.raindrop.favorite_service.dto.request.UserEmailRequest;
import com.raindrop.favorite_service.dto.response.UserEmailResponse;
import com.raindrop.favorite_service.repository.httpclient.UserClient;
import com.raindrop.favorite_service.service.FavoriteService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NewChapterEventConsummer {
    FavoriteService favoriteService;
    UserClient userClient;
    NewChapterEventProducer chapterEventProducer;

    @KafkaListener(topics = "manga-new-chapter")
    public void consumeNewChapterEvent(NewChapterEvent event) {
        List<String> favoriteUsers = favoriteService.userIdsByMangaId(event.getMangaId());
        UserEmailResponse response = userClient.getUserInfoById(UserEmailRequest.builder().ids(favoriteUsers).build()).getResult();
        response.getUserInfoResponses().forEach(user -> {
            chapterEventProducer.sendNewChapterEvent(
                    event.getMangaId(),
                    event.getMangaTitle(),
                    event.getChapterId(),
                    event.getChapterNumber(),
                    event.getChapterTitle(),
                    user.getEmail(),
                    user.getDisplayName()
            );
        });
    }
}
