package com.raindrop.identity_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GoogleLoginRequest {
    @NotBlank(message = "CODE_REQUIRED")
    String code;

    @NotBlank(message = "REDIRECT_URI_REQUIRED")
    String redirectUri;
}
