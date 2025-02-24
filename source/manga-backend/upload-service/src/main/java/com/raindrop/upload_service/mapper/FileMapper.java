package com.raindrop.upload_service.mapper;

import com.raindrop.upload_service.dto.request.FileRequest;
import com.raindrop.upload_service.dto.response.FileResponse;
import com.raindrop.upload_service.entity.File;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface FileMapper {
    File toFile(FileRequest request);
    FileResponse toFileResponse(File file);
}
