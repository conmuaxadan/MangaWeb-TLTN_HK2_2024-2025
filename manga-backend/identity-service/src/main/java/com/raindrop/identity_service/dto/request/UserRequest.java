package com.raindrop.identity_service.dto.request;



import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserRequest {
    @NotBlank(message = "USERNAME_REQUIRED")
    @Size(min = 6, message = "USERNAME_TOO_SHORT")
    @Pattern(regexp = "^[a-z0-9]+$", message = "USERNAME_INVALID")
    String username;

    @NotBlank(message = "PASSWORD_REQUIRED")
    @Size(min = 8, message = "PASSWORD_TOO_SHORT")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$", message = "PASSWORD_INVALID")
    String password;

    @NotBlank(message = "EMAIL_REQUIRED")
    @Email(message = "EMAIL_INVALID")
    String email;

    @Size(min = 6, max = 16, message = "Display name must be between 6 and 16 characters")
    String displayName;
    String avatarUrl;

    List<Long> roles;
}
