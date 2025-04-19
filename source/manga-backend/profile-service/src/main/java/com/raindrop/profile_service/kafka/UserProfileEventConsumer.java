package com.raindrop.profile_service.kafka;

import com.raindrop.common.event.UserProfileEvent;
import com.raindrop.profile_service.dto.request.UserProfileRequest;
import com.raindrop.profile_service.service.UserProfileService;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserProfileEventConsumer {
    UserProfileService userProfileService;

    @KafkaListener(topics = "onboard-successful")
    public void consumeUserProfileEvent(UserProfileEvent message) {
        log.info("Received user profile event: {}", message);
        
        UserProfileRequest request = UserProfileRequest.builder()
                .userId(message.getUserId())
                .email(message.getEmail())
                .displayName(message.getDisplayName())
                .avatarUrl(message.getAvatarUrl())
                .build();

        userProfileService.createProfile(request);
        log.info("Created user profile for user ID: {}", message.getUserId());
    }
}
