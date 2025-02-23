package com.raindrop.manga_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Manga {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    String title;
    String author;
    String description;
    @ManyToMany
    Set<Genre> genres;
    @OneToMany
    Set<Chapter> chapters;
}
