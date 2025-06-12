package com.raindrop.manga_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EntityListeners(AuditingEntityListener.class)
public class Chapter {    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    
    @Min(value = 0, message = "Chapter number must be greater than or equal to 0")
    double chapterNumber;
    
    String title;
    int views;
    int comments;
    @OneToMany(mappedBy = "chapter", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Page> pages;
    @ManyToOne
    @JoinColumn(name = "manga_id", nullable = false)
    Manga manga;
    @Column(updatable = false)
    @CreatedDate
    LocalDateTime createdAt;
    @LastModifiedDate
    LocalDateTime updatedAt;

    // Người tạo chương
    @Column(name = "created_by", updatable = false)
    String createdBy;
}