package com.raindrop.identity_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * DTO chứa thông tin yêu cầu liên kết tài khoản Google
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GoogleLinkRequest {
    @NotBlank(message = "CODE_REQUIRED")
    String code;
    
    @NotBlank(message = "REDIRECT_URI_REQUIRED")
    String redirectUri;
}
