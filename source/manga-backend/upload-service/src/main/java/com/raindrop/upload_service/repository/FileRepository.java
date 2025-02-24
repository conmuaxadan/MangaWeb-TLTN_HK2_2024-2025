package com.raindrop.upload_service.repository;

import com.raindrop.upload_service.entity.File;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileRepository extends JpaRepository<File, String> {
}
