package com.raindrop.upload_service.repository;

import com.raindrop.upload_service.entity.FileData;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FileDataRepository extends JpaRepository<FileData, String> {
    Optional<FileData> findByName(String fileName);
}
