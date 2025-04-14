package com.raindrop.profile_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CommentRequest {
    @NotBlank(message = "Manga ID is required")
    String mangaId;
    
    @NotBlank(message = "Chapter ID is required")
    String chapterId;
    
    @NotBlank(message = "Content is required")
    String content;
}
