package com.raindrop.profile_service.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReadingHistoryRequest {
    @NotBlank(message = "Manga ID is required")
    String mangaId;
    
    @NotBlank(message = "Chapter ID is required")
    String chapterId;
    
    @Min(value = 0, message = "Last page must be a positive number")
    Integer lastPage;
}
