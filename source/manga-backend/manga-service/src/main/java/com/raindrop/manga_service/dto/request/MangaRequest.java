package com.raindrop.manga_service.dto.request;

import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Genre;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
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
    String status;
}
