package com.raindrop.identity_service.kafka;

import com.raindrop.common.event.UserProfileEvent;
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
public class UserProfileEventProducer {
    KafkaTemplate<String, Object> kafkaTemplate;
    
    private static final String ONBOARD_TOPIC = "onboard-successful";
    
    /**
     * Gửi sự kiện tạo profile người dùng
     * @param event Thông tin profile người dùng
     */
    public void sendUserProfileEvent(UserProfileEvent event) {
        log.info("Sending user profile event to Kafka for user: {}", event.getDisplayName());
        kafkaTemplate.send(ONBOARD_TOPIC, event);
        log.info("User profile event sent successfully for user ID: {}", event.getUserId());
    }
}
