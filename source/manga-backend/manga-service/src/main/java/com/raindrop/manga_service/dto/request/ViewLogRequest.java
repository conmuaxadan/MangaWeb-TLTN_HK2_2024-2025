package com.raindrop.manga_service.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ViewLogRequest {
    @NotBlank(message = "Chapter ID is required")
    String chapterId;
    
    String userId;
    
    @NotBlank(message = "Session ID is required")
    String sessionId;
    
    @Min(value = 0, message = "Scroll percentage must be between 0 and 100")
    @Max(value = 100, message = "Scroll percentage must be between 0 and 100")
    int scrollPercentage;
}
