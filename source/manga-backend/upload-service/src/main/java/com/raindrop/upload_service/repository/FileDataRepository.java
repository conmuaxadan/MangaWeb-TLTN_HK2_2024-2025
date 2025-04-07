package com.raindrop.upload_service.repository;

import com.raindrop.upload_service.entity.FileInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FileDataRepository extends JpaRepository<FileInfo, Long> {
    Optional<FileInfo> findByName(String fileName);
    boolean existsByName(String fileName);
}
