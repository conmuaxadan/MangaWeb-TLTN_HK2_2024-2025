package com.raindrop.notification_service.dto.response;

import com.raindrop.notification_service.dto.request.Recipient;
import com.raindrop.notification_service.dto.request.Sender;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmailResponse {
    String messageId;

}
