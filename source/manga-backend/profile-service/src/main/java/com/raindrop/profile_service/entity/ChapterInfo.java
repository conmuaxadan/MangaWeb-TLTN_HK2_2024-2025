package com.raindrop.profile_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "chapter_info")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EntityListeners(AuditingEntityListener.class)
public class ChapterInfo {
    @Id
    String id; // chapterId from Manga Service
    
    String mangaId;
    
    Integer chapterNumber;
    
    String title;
    
    @Column(name = "created_at", updatable = false)
    @CreatedDate
    LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    @LastModifiedDate
    LocalDateTime updatedAt;
    
    @Version
    Integer version;
}
