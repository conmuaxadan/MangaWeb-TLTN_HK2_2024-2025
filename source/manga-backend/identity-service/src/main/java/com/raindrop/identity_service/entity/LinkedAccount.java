package com.raindrop.identity_service.entity;

import com.raindrop.identity_service.enums.AuthProvider;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entity lưu trữ thông tin liên kết tài khoản
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EntityListeners(AuditingEntityListener.class)
public class LinkedAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    
    @ManyToOne
    User user; // User chính
    
    @Enumerated(EnumType.STRING)
    AuthProvider provider; // LOCAL, GOOGLE, FACEBOOK, etc.
    
    // Thông tin cho LOCAL provider
    String username; // Có thể null nếu không phải LOCAL
    String email;    // Email của provider này
    String password; // Chỉ dùng cho LOCAL, các provider khác là null
    
    // Thông tin cho các provider khác
    String providerUserId; // ID từ provider (Google ID, Facebook ID, etc.)
    
    // Thời gian liên kết
    @Column(updatable = false)
    @CreatedDate
    LocalDateTime linkedAt;
}
