package com.raindrop.upload_service.service;

import com.raindrop.upload_service.dto.response.FileInfoResponse;
import com.raindrop.upload_service.entity.FileData;
import com.raindrop.upload_service.entity.FileInfo;
import com.raindrop.upload_service.repository.FileDataRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class FileService {
    FileDataRepository fileDataRepository;

    @Value("${app.upload.manga}")
    @NonFinal
    String MANGA_FOLDER_PATH;

    @Value("${app.upload.user}")
    @NonFinal
    String USER_FOLDER_PATH;

    public FileInfoResponse uploadMangaFile(MultipartFile file) throws IOException {
        String fileExtension = StringUtils.getFilenameExtension(Objects.requireNonNull(file.getOriginalFilename()));
        String fileName = Objects.isNull(fileExtension)
                ? UUID.randomUUID().toString()
                : UUID.randomUUID().toString() + "." + fileExtension;

        FileInfo fileData = fileDataRepository.save(FileInfo.builder()
                        .name(fileName)
                        .filePath(MANGA_FOLDER_PATH + fileName)
                        .fileType(file.getContentType())
                .build());

        file.transferTo(new File(fileData.getFilePath()));
        return FileInfoResponse.builder()
                .name(fileName)
                .build();
    }

    public FileInfoResponse uploadUserFile(MultipartFile file) throws IOException {
        String fileExtension = StringUtils.getFilenameExtension(Objects.requireNonNull(file.getOriginalFilename()));
        String fileName = Objects.isNull(fileExtension)
                ? UUID.randomUUID().toString()
                : UUID.randomUUID().toString() + "." + fileExtension;

        FileInfo fileData = fileDataRepository.save(FileInfo.builder()
                .name(fileName)
                .filePath(USER_FOLDER_PATH + fileName)
                .build());

        file.transferTo(new File(fileData.getFilePath()));
        return FileInfoResponse.builder()
                .name(fileName)
                .build();
    }

    public FileData read(String fileName) throws IOException {
        var file = fileDataRepository.findByName(fileName).orElseThrow();
        return FileData.builder()
                .contentType(file.getFileType())
                .resource(new ByteArrayResource(readFile(fileName)))
                .build();
    }


    public byte[] readFile(String fileName) throws IOException {
        Optional<FileInfo> fileData = fileDataRepository.findByName(fileName);
        String filePath=fileData.get().getFilePath();
        byte[] images = Files.readAllBytes(new File(filePath).toPath());
        return images;
    }

    public void deleteFile(String fileName) throws IOException {
        Optional<FileInfo> fileData = fileDataRepository.findByName(fileName);
        String filePath=fileData.get().getFilePath();
        Files.deleteIfExists(Paths.get(filePath));
        fileDataRepository.delete(fileData.get());
    }



}
