package com.raindrop.upload_service.controller;

import com.raindrop.upload_service.dto.request.FileRequest;
import com.raindrop.upload_service.dto.response.ApiResponse;
import com.raindrop.upload_service.dto.response.FileResponse;
import com.raindrop.upload_service.service.FileService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class FileController {
    FileService fileService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileResponse> uploadFile(@ModelAttribute @Valid FileRequest request) {
        return ApiResponse.<FileResponse>builder()
                .message("File uploaded successfully")
                .result(fileService.upload(request))
                .build();
    }

    @PostMapping(value = "/upload-zip", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<FileResponse>> uploadZipFile(@RequestPart("file") MultipartFile zipFile) {
        List<FileResponse> fileResponses = fileService.uploadZipFile(zipFile);
        return ApiResponse.<List<FileResponse>>builder()
                .message("Zip file uploaded and extracted successfully")
                .result(fileResponses)
                .build();
    }
}
