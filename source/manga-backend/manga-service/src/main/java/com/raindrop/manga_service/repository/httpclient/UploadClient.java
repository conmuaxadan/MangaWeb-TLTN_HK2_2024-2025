package com.raindrop.manga_service.repository.httpclient;

import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.FileDataResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(name = "upload-service", url = "${app.services.upload}")
public interface UploadClient {
    @PostMapping(value = "/files/manga", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<FileDataResponse> uploadMedia(@RequestPart("image") MultipartFile file);

    @DeleteMapping(value = "/files/{fileName}")
    ApiResponse<Void> deleteMedia(@RequestPart("fileName") String fileName);
}
