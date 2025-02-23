package com.raindrop.manga_service.mapper;

import com.raindrop.manga_service.dto.request.ChapterRequest;
import com.raindrop.manga_service.dto.response.ChapterResponse;
import com.raindrop.manga_service.entity.Chapter;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ChapterMapper {
    Chapter toChapter(ChapterRequest request);
    ChapterResponse toChapterResponse(Chapter chapter);
    void updateChapter(@MappingTarget Chapter chapter, ChapterRequest request);

}
