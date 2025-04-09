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
    @NotBlank(message = "Username is required")
    @Size(min = 5, message = "USERNAME_INVALID")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain letters, numbers, dots, underscores, and hyphens")
    String username;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "PASSWORD_INVALID")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$", message = "Password must contain at least one digit, one lowercase, one uppercase, and one special character")
    String password;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email;
    List<String> roles;
}
