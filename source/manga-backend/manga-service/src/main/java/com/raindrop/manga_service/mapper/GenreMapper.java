package com.raindrop.manga_service.mapper;

import com.raindrop.manga_service.dto.request.GenreRequest;
import com.raindrop.manga_service.dto.response.GenreResponse;
import com.raindrop.manga_service.entity.Genre;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface GenreMapper {
    Genre toGenre(GenreRequest request);
    GenreResponse toGenreResponse(Genre genre);
    void updateGenre(@MappingTarget Genre genre, GenreRequest request);
}
