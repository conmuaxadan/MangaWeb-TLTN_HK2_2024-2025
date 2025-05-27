package com.raindrop.identity_service.kafka;

import com.raindrop.common.event.BlockUserEvent;
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
public class UserBlockEventProducer {
    KafkaTemplate<String, BlockUserEvent> kafkaTemplate;

    private static final String BLOCK_USER_TOPIC = "block-user";
    private static final String UNBLOCK_USER_TOPIC = "unblock-user";

    public void sendBlockUserEvent(String email, String displayName, String reason) {
        BlockUserEvent event = BlockUserEvent.builder()
                .email(email)
                .displayName(displayName)
                .reason(reason)
                .build();

        kafkaTemplate.send(BLOCK_USER_TOPIC, event);
        log.info("Sent BLOCK_USER event to Kafka for user: {}", email );
    }

    public void sendUnblockUserEvent(String email, String displayName, String reason) {
        BlockUserEvent event = BlockUserEvent.builder()
                .email(email)
                .displayName(displayName)
                .reason("unblock")
                .build();

        kafkaTemplate.send(UNBLOCK_USER_TOPIC, event);
        log.info("Sent UNBLOCK_USER event to Kafka for user: {}", email);
    }


}
