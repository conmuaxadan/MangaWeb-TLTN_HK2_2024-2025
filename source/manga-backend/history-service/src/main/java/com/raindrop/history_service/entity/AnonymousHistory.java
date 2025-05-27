package com.raindrop.history_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "anonymous_histories", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"session_id", "manga_id", "chapter_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EntityListeners(AuditingEntityListener.class)
public class AnonymousHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "session_id", nullable = false)
    String sessionId;

    @Column(name = "manga_id", nullable = false)
    String mangaId;

    @Column(name = "chapter_id", nullable = false)
    String chapterId;

    @Column(name = "ip_address")
    String ipAddress;

    @Column(name = "created_at", updatable = false)
    @CreatedDate
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    @LastModifiedDate
    LocalDateTime updatedAt;
}
