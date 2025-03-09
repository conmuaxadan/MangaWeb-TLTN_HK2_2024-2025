package com.raindrop.upload_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ImageData {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    String name;
    String type;

    @Lob
    @Column(name = "image_data", length = 1000)
    byte[] imageData;
}
