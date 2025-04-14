package com.raindrop.manga_service.mapper;

import com.raindrop.manga_service.dto.request.ChapterRequest;
import com.raindrop.manga_service.dto.response.ChapterResponse;
import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.repository.httpclient.UploadClient;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ChapterMapper {
    @Mapping(target = "id", source = "id")
    @Mapping(target = "views", source = "views")
    ChapterResponse toChapterResponse(Chapter chapter);

}
