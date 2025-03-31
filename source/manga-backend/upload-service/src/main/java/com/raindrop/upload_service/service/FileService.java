package com.raindrop.upload_service.service;

import com.raindrop.upload_service.dto.response.FileDataResponse;
import com.raindrop.upload_service.entity.FileData;
import com.raindrop.upload_service.repository.FileDataRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class FileService {
    FileDataRepository fileDataRepository;
    final String FOLDER_PATH = "C:/uploads/";

    public FileDataResponse uploadFile(MultipartFile file) throws IOException {
        String fileExtension = StringUtils.getFilenameExtension(Objects.requireNonNull(file.getOriginalFilename()));
        String fileName = Objects.isNull(fileExtension)
                ? UUID.randomUUID().toString()
                : UUID.randomUUID().toString() + "." + fileExtension;

        FileData fileData = fileDataRepository.save(FileData.builder()
                        .name(fileName)
                        .filePath(FOLDER_PATH + fileName)
                .build());

        file.transferTo(new File(fileData.getFilePath()));
        return FileDataResponse.builder()
                .url("http://localhost:8084/upload/files/" + fileName)
                .build();
    }

    public List<FileDataResponse> uploadFiles(List<MultipartFile> files) throws IOException {
        List<FileDataResponse> uploadedFiles = new ArrayList<>();

        for (MultipartFile file : files) {
            String fileExtension = StringUtils.getFilenameExtension(Objects.requireNonNull(file.getOriginalFilename()));
            String fileName = Objects.isNull(fileExtension)
                    ? UUID.randomUUID().toString()
                    : UUID.randomUUID().toString() + "." + fileExtension;

            FileData fileData = fileDataRepository.save(FileData.builder()
                    .name(fileName)
                    .filePath(FOLDER_PATH + fileName)
                    .build());

            file.transferTo(new File(fileData.getFilePath()));

            uploadedFiles.add(FileDataResponse.builder()
                    .url("http://localhost:8084/upload/media/" + fileName)
                    .build());
        }

        return uploadedFiles;
    }


    public byte[] readFile(String fileName) throws IOException {
        Optional<FileData> fileData = fileDataRepository.findByName(fileName);
        String filePath=fileData.get().getFilePath();
        byte[] images = Files.readAllBytes(new File(filePath).toPath());
        return images;
    }



}
