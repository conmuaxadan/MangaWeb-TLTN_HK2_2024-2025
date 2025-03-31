package com.raindrop.profile_service.controller;


import com.raindrop.event.UserProfileEvent;
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
public class ProfileController {
    UserProfileService userProfileService;

    @KafkaListener(topics = "onboard-successful")
    public void listenUserProfile(UserProfileEvent message) {
        UserProfileRequest request = UserProfileRequest.builder()
                .userId(message.getUserId())
                .displayName(message.getDisplayName())
                .avatarUrl(message.getAvatarUrl())
                .build();

        userProfileService.createProfile(request);
    }
}
