package com.raindrop.identity_service.kafka;

import com.raindrop.common.event.PasswordResetEvent;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PasswordResetEventProducer {
    KafkaTemplate<String, PasswordResetEvent> kafkaTemplate;

    private static final String PASSWORD_RESET_TOPIC = "password-reset";

    public void sendPasswordResetEvent(String email, String displayName, String resetCode) {
        PasswordResetEvent event = PasswordResetEvent.builder()
                .email(email)
                .displayName(displayName)
                .resetCode(resetCode)
                .build();
                
        kafkaTemplate.send(PASSWORD_RESET_TOPIC, event);
    }
}
