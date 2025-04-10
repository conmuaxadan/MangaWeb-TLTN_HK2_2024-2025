package com.raindrop.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MangaInfoEvent {
    private String mangaId;
    private String title;
    private String description;
    private String author;
    private String coverUrl;
}
