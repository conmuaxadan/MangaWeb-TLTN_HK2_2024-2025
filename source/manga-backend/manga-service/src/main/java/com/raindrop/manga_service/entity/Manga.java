package com.raindrop.manga_service.entity;

import com.raindrop.manga_service.enums.MangaStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EntityListeners(AuditingEntityListener.class)
public class Manga {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    @NotBlank
    String title;
    @NotBlank
    String author;
    int views;
    int loves;
    int comments;
    String coverUrl;
    @Column(columnDefinition = "TEXT")
    String description;
    @ManyToMany(cascade = CascadeType.PERSIST,fetch = FetchType.LAZY)
    List<Genre> genres = new ArrayList<>();
    int yearOfRelease;
    @Enumerated(EnumType.STRING)
    MangaStatus status;
    @Column(updatable = false)
    @CreatedDate
    LocalDateTime createdAt;
    @LastModifiedDate
    LocalDateTime updatedAt;

    //ID chapter mới nhất
    String lastChapterId;
    // Thời gian thêm chapter mới nhất
    LocalDateTime lastChapterAddedAt;

    // Các trường cho xóa mềm
    @Column(nullable = false)
    boolean deleted = false;
    @Column(name = "deleted_at")
    LocalDateTime deletedAt;
    @Column(name = "deleted_by")
    String deletedBy;
}
