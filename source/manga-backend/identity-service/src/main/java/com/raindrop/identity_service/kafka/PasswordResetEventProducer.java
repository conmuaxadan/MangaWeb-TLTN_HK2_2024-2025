package com.raindrop.identity_service.kafka;

import com.raindrop.common.event.PasswordResetEvent;
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
        log.info("Sent PASSWORD_RESET event to Kafka for email: {}", email);
    }
}
