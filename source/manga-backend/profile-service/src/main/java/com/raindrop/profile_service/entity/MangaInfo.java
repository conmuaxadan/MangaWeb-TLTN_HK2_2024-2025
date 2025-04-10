package com.raindrop.profile_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "manga_info")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EntityListeners(AuditingEntityListener.class)
public class MangaInfo {
    @Id
    String id; // mangaId from Manga Service
    
    String title;
    
    @Column(columnDefinition = "TEXT")
    String description;
    
    String author;
    
    String coverUrl;
    
    @Column(name = "created_at", updatable = false)
    @CreatedDate
    LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    @LastModifiedDate
    LocalDateTime updatedAt;
    
    @Version
    Integer version;
}
