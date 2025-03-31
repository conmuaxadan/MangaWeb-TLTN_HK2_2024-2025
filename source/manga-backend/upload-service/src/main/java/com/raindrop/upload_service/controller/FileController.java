package com.raindrop.upload_service.controller;

import com.raindrop.upload_service.dto.response.ApiResponse;
import com.raindrop.upload_service.dto.response.FileDataResponse;
import com.raindrop.upload_service.service.FileService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class FileController {
    FileService fileService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileDataResponse> uploadImageToFIleSystem(@RequestParam("image")MultipartFile file) throws IOException {
        FileDataResponse uploadImage = fileService.uploadFile(file);
        return ApiResponse.<FileDataResponse>builder()
                .result(uploadImage)
                .build();
    }

    @GetMapping("/{fileName}")
    public ResponseEntity<?> downloadImageFromFileSystem(@PathVariable String fileName) throws IOException {
        byte[] imageData=fileService.readFile(fileName);
        return ResponseEntity.status(HttpStatus.OK)
                .contentType(MediaType.valueOf("image/png"))
                .body(imageData);

    }

}
