package com.raindrop.notification_service.listener;

import com.raindrop.common.event.UserProfileEvent;
import com.raindrop.notification_service.dto.request.Recipient;
import com.raindrop.notification_service.dto.request.SendEmailRequest;
import com.raindrop.notification_service.service.EmailService;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class WelcomeKafkaListener {
    EmailService emailService;

    @KafkaListener(topics = "onboard-successful")
    public void listenUserProfile(UserProfileEvent message) {
        SendEmailRequest request = SendEmailRequest.builder()
                .to(Recipient.builder()
                        .name(message.getDisplayName())
                        .email(message.getEmail())
                        .build())
                .subject("Welcome to Raindrop Manga")
                .htmlContent("<p>Hi " + message.getDisplayName() + ", welcome to Raindrop Manga!</p>")
                .build();
        emailService.sendEmail(request);
    }
}
