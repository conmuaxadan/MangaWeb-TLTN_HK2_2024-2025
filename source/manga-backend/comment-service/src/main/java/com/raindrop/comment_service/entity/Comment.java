package com.raindrop.comment_service.entity;

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

    // Thay vì sử dụng UserProfile, chúng ta sẽ lưu trữ userId
    @Column(name = "user_id", nullable = false)
    String userId;
    
    // Thông tin bổ sung về người dùng
    @Column(name = "username")
    String username;
    
    @Column(name = "user_avatar_url")
    String userAvatarUrl;

    @Column(name = "chapter_id", nullable = false)
    String chapterId;

    @Column(name = "manga_id", nullable = false)
    String mangaId;

    @Column(columnDefinition = "TEXT", nullable = false)
    String content;

    @Column(name = "created_at", updatable = false)
    @CreatedDate
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    @LastModifiedDate
    LocalDateTime updatedAt;
}
