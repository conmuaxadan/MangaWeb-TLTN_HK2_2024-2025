package com.raindrop.manga_service.mapper;

import com.raindrop.manga_service.dto.request.MangaRequest;
import com.raindrop.manga_service.dto.response.MangaResponse;
import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Genre;
import com.raindrop.manga_service.entity.Manga;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface MangaMapper {
    @Mapping(target = "genres", ignore = true)
    @Mapping(target = "chapters", ignore = true)
    Manga toManga(MangaRequest request);

    @Mapping(target = "genres", ignore = true)
    @Mapping(target = "chapters",ignore = true)
    MangaResponse toMangaResponse(Manga manga);

    @Mapping(target = "genres", ignore = true)
    @Mapping(target = "chapters", ignore = true)
    void updateManga(@MappingTarget Manga manga, MangaRequest request);

}
