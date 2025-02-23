package com.raindrop.manga_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Chapter {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    int chapterNumber;
    String title;
    String content;
    @ManyToOne
    Manga manga;
}
