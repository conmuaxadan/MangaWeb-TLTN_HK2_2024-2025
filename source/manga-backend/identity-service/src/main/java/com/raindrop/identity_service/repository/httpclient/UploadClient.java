package com.raindrop.identity_service.repository.httpclient;

import com.raindrop.identity_service.dto.response.ApiResponse;
import com.raindrop.identity_service.dto.response.FileInfoResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(name = "upload-service", url = "${app.services.upload}")
public interface UploadClient {
    @PostMapping(value = "/files/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<FileInfoResponse> uploadAvatar(@RequestHeader("Authorization") String token, @RequestPart("image") MultipartFile file);

    @DeleteMapping(value = "/files/{fileName}")
    ApiResponse<Void> deleteFile(@RequestHeader("Authorization") String token, @PathVariable("fileName") String fileName);
}
