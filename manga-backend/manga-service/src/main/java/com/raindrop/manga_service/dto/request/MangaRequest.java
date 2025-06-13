package com.raindrop.manga_service.dto.request;

import com.raindrop.manga_service.enums.MangaStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MangaRequest {
    String title;
    String author;
    String description;
    MultipartFile cover;
    Set<String> genres;
    int yearOfRelease;
    MangaStatus status;
}
