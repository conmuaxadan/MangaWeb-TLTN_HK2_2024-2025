package com.raindrop.identity_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ToggleUserStatusRequest {
    @NotBlank(message = "USER_ID_REQUIRED")
    String userId;
    boolean enabled;
    String reason;
}
