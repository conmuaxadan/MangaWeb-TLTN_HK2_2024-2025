package com.raindrop.profile_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EntityListeners(AuditingEntityListener.class)
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "user_id", nullable = false)
    String userId;

    @Column(name = "profile_id")
    String profileId;

    @Column(name = "chapter_id", nullable = false)
    String chapterId;

    @Column(name = "manga_id", nullable = false)
    String mangaId;

    @Column(name = "username")
    String username;

    @Column(columnDefinition = "TEXT", nullable = false)
    String content;

    @Column(name = "created_at", updatable = false)
    @CreatedDate
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    @LastModifiedDate
    LocalDateTime updatedAt;

    @Version
    Integer version;
}
