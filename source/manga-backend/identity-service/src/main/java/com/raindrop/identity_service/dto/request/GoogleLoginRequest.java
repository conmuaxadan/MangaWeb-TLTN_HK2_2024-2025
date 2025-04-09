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
    @NotBlank(message = "Authorization code is required")
    String code;

    @NotBlank(message = "Redirect URI is required")
    String redirectUri;
}
