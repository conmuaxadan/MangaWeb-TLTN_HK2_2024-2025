package com.raindrop.upload_service.service;

import com.raindrop.upload_service.dto.response.FileDataResponse;
import com.raindrop.upload_service.entity.FileData;
import com.raindrop.upload_service.repository.FileDataRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class FileService {
    FileDataRepository fileDataRepository;
    final String FOLDER_PATH = "C:/Users/Ra1ndr0p/Desktop/uploads/";
    final String baseUrl = "http://localhost:8084";

    public FileDataResponse uploadFileToFileSystem(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is null or empty");
        }

        try {
            // Đầu tiên lưu vào database để lấy ID
            FileData fileData = fileDataRepository.save(FileData.builder()
                    .type("image/jpeg")
                    .build());

            // Sử dụng ID làm tên file
            String jpgFileName = fileData.getId() + ".jpg";
            String filePath = Paths.get(FOLDER_PATH, jpgFileName).toString();

            // Đọc và ghi file ảnh
            BufferedImage bufferedImage = ImageIO.read(file.getInputStream());
            if (bufferedImage == null) {
                throw new IOException("Invalid image file");
            }
            File outputFile = new File(filePath);
            ImageIO.write(bufferedImage, "jpg", outputFile);

            // Cập nhật lại fileData với thông tin đường dẫn
            fileData.setName(jpgFileName);
            fileData.setFilePath(filePath);
            fileDataRepository.save(fileData);

            return FileDataResponse.builder()
                    .url(convertToUrl(jpgFileName))
                    .build();
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    public byte[] downloadFileFromFileSystem(String fileName) {
        Optional<FileData> fileData = fileDataRepository.findByName(fileName);
        String filePath = fileData.get().getFilePath();
        try {
            byte[] images = Files.readAllBytes(new java.io.File(filePath).toPath());
            return images;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private String convertToUrl(String fileName) {
        return String.format("%s/upload/files/%s", baseUrl, fileName);
    }

}
