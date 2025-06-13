package com.raindrop.identity_service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * DTO chứa thông tin yêu cầu liên kết tài khoản local
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LinkLocalAccountRequest {
    @NotBlank(message = "USERNAME_REQUIRED")
    @jakarta.validation.constraints.Size(min = 6, message = "USERNAME_TOO_SHORT")
    @jakarta.validation.constraints.Pattern(regexp = "^[a-z0-9]+$", message = "USERNAME_INVALID")
    String username;

    @NotBlank(message = "EMAIL_REQUIRED")
    @Email(message = "INVALID_EMAIL")
    String email;

    @NotBlank(message = "PASSWORD_REQUIRED")
    String password;
}
