package com.raindrop.manga_service.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChapterRequest {
    int chapterNumber;
    String title;
    List<MultipartFile> pages;
    String mangaId;
}
