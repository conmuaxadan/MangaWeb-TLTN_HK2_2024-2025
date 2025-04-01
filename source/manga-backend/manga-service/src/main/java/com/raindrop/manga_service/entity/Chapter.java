package com.raindrop.manga_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EntityListeners(AuditingEntityListener.class)
public class Chapter {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    int chapterNumber;
    String title;
    @ManyToMany
    @JoinTable(
            name = "chapter_pages", // Tên bảng trung gian
            joinColumns = @JoinColumn(name = "chapter_id"), // Cột liên kết với Chapter
            inverseJoinColumns = @JoinColumn(name = "page_id") // Cột liên kết với Page
    )
    Set<Page> pages;
    @ManyToOne
    @JoinColumn(name = "manga_id", nullable = false)
    Manga manga;
    @Column(updatable = false)
    @CreatedDate
    LocalDateTime createdAt;
    @LastModifiedDate
    LocalDateTime updatedAt;
}
