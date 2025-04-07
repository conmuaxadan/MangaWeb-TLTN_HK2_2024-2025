package com.raindrop.upload_service.controller;

import com.raindrop.upload_service.dto.response.ApiResponse;
import com.raindrop.upload_service.dto.response.FileInfoResponse;
import com.raindrop.upload_service.service.FileService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@RestController
@RequestMapping()
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class FileController {
    FileService fileService;

    @PostMapping(value = "mangas",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileInfoResponse> uploadMangaFile(@RequestParam("image")MultipartFile file) throws IOException {
        FileInfoResponse uploadImage = fileService.uploadMangaFile(file);
        return ApiResponse.<FileInfoResponse>builder()
                .result(uploadImage)
                .build();
    }

    @PostMapping(value = "avatars",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileInfoResponse> uploadAvatarFile(@RequestParam("image")MultipartFile file) throws IOException {
        FileInfoResponse uploadImage = fileService.uploadUserFile(file);
        return ApiResponse.<FileInfoResponse>builder()
                .result(uploadImage)
                .build();
    }

    @GetMapping("/{fileName}")
    public ResponseEntity<Resource> downloadImageFromFileSystem(@PathVariable String fileName) throws IOException {
        var fileData = fileService.read(fileName);
        return ResponseEntity.<Resource>status(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_TYPE, fileData.getContentType())
                .body(fileData.getResource());

    }

    @DeleteMapping("/{fileName}")
    public ApiResponse<Void> deleteImageFromFileSystem(@PathVariable String fileName) throws IOException {
        fileService.deleteFile(fileName);
        return ApiResponse.<Void>builder()
                .build();
    }

}
