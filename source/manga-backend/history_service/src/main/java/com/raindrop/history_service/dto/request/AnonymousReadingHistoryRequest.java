package com.raindrop.history_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnonymousReadingHistoryRequest {
    @NotBlank(message = "Manga ID is required")
    String mangaId;
    
    @NotBlank(message = "Chapter ID is required")
    String chapterId;
    
    @NotBlank(message = "Session ID is required")
    String sessionId;
}
