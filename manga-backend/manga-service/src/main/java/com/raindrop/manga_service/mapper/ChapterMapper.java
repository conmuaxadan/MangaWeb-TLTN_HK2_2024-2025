package com.raindrop.manga_service.mapper;

import com.raindrop.manga_service.dto.response.ChapterResponse;
import com.raindrop.manga_service.entity.Chapter;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ChapterMapper {
    @Mapping(target = "id", source = "id")
    @Mapping(target = "views", source = "views")
    @Mapping(target = "comments", source = "comments")
    @Mapping(target = "mangaId", source = "manga.id")
    ChapterResponse toChapterResponse(Chapter chapter);

}
