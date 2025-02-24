package com.raindrop.upload_service.service;

import com.raindrop.upload_service.dto.request.FileRequest;
import com.raindrop.upload_service.dto.response.FileResponse;
import com.raindrop.upload_service.entity.File;
import com.raindrop.upload_service.mapper.FileMapper;
import com.raindrop.upload_service.repository.FileRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class FileService {
    FileRepository fileRepository;
    FileMapper fileMapper;

    public FileResponse upload(FileRequest request) {
        try {
            MultipartFile multipartFile = request.getFile();
            String fileName = StringUtils.hasText(request.getName())
                    ? request.getName()
                    : multipartFile.getOriginalFilename();

            File file = File.builder()
                    .name(fileName)
                    .type(multipartFile.getContentType())
                    .size(multipartFile.getSize())
                    .url(saveFileToStorage(multipartFile))
                    .build();

            fileRepository.save(file);
            return fileMapper.toFileResponse(file);
        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage());
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    private String saveFileToStorage(MultipartFile file) throws IOException {
        String uploadDir = "uploads";
        Path uploadPath = Paths.get(uploadDir);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String filePath = uploadDir + "/" + file.getOriginalFilename();
        Files.copy(file.getInputStream(), Paths.get(filePath), StandardCopyOption.REPLACE_EXISTING);
        return filePath;
    }

    public List<FileResponse> uploadZipFile(MultipartFile zipFile) {
        List<FileResponse> fileResponses = new ArrayList<>();

        try (ZipInputStream zipInputStream = new ZipInputStream(zipFile.getInputStream())) {
            ZipEntry zipEntry;
            while ((zipEntry = zipInputStream.getNextEntry()) != null) {
                if (!zipEntry.isDirectory()) {
                    String fileName = UUID.randomUUID().toString();
                    Path filePath = Paths.get("uploads", fileName);
                    Files.copy(zipInputStream, filePath, StandardCopyOption.REPLACE_EXISTING);

                    File file = File.builder()
                            .name(fileName)
                            .type(Files.probeContentType(filePath))
                            .url(filePath.toString().replace("\\", "/"))
                            .size(Files.size(filePath))
                            .build();
                    fileRepository.save(file);
                    fileResponses.add(fileMapper.toFileResponse(file));
                }
                zipInputStream.closeEntry();
            }
        } catch (IOException e) {
            log.error("Failed to upload and extract zip file: {}", e.getMessage());
            throw new RuntimeException("Failed to upload and extract zip file", e);
        }

        return fileResponses;
    }

    public FileResponse getFileById(String id) {
        File file = fileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));
        return fileMapper.toFileResponse(file);
    }

    public void deleteFile(String id) {
        fileRepository.deleteById(id);
    }

}
