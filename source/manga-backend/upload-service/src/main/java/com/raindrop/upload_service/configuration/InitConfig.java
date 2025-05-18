package com.raindrop.upload_service.configuration;

import com.raindrop.upload_service.entity.FileInfo;
import com.raindrop.upload_service.repository.FileDataRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class InitConfig {
    @Bean
    @Transactional
    ApplicationRunner applicationRunner(FileDataRepository fileDataRepository) {
        return args -> {
            if (!fileDataRepository.existsByName("default.jpg")) {
                fileDataRepository.save(FileInfo.builder()
                        .name("default.jpg")
                        .filePath("C:/uploads/user/default.jpg")
                        .fileType("image/jpeg")
                        .build());
            }
        };
    }
}
