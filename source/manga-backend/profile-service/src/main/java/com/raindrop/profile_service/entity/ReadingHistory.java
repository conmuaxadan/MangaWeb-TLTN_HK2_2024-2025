package com.raindrop.profile_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "reading_history", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "manga_id", "chapter_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EntityListeners(AuditingEntityListener.class)
public class ReadingHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    
    @Column(name = "user_id", nullable = false)
    String userId;
    
    @Column(name = "manga_id", nullable = false)
    String mangaId;
    
    @Column(name = "chapter_id", nullable = false)
    String chapterId;
    
    @Column(name = "manga_title")
    String mangaTitle;
    
    @Column(name = "chapter_number")
    Integer chapterNumber;
    
    @Column(name = "last_page")
    Integer lastPage;
    
    @Column(name = "read_at", updatable = false)
    @CreatedDate
    LocalDateTime readAt;
    
    @Column(name = "updated_at")
    @LastModifiedDate
    LocalDateTime updatedAt;
    
    @Version
    Integer version;
}
