package com.raindrop.identity_service.kafka;

import com.raindrop.common.event.UserEvent;
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
public class UserEventProducer {
    KafkaTemplate<String, UserEvent> kafkaTemplate;

    private static final String NEW_USER_TOPIC = "onboard-successful";

    public void sendNewUserEvent(UserEvent event) {
        kafkaTemplate.send(NEW_USER_TOPIC, event);
    }
}
