package com.raindrop.manga_service.mapper;

import com.raindrop.manga_service.dto.request.MangaRequest;
import com.raindrop.manga_service.dto.response.MangaResponse;
import com.raindrop.manga_service.entity.Manga;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface MangaMapper {
    @Mapping(target = "genres", ignore = true)
    @Mapping(target = "chapters", ignore = true)
    Manga toManga(MangaRequest request);
    MangaResponse toMangaResponse(Manga manga);
    @Mapping(target = "genres", ignore = true)
    @Mapping(target = "chapters", ignore = true)
    void updateManga(@MappingTarget Manga manga, MangaRequest request);
}
