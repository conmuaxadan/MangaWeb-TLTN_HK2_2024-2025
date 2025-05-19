package com.raindrop.identity_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChangeDisplayNameRequest {
    @NotBlank(message = "Display name is required")
    @Size(min = 6, max = 16, message = "Display name must be between 6 and 16 characters")
    String displayName;
}
