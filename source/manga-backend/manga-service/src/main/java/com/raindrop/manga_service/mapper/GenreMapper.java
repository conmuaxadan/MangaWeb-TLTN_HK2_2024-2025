package com.raindrop.manga_service.mapper;

import com.raindrop.manga_service.dto.request.GenreRequest;
import com.raindrop.manga_service.dto.response.GenreResponse;
import com.raindrop.manga_service.entity.Genre;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Mapper(componentModel = "spring")
public interface GenreMapper {
    Logger log = LoggerFactory.getLogger(GenreMapper.class);

    @Named("logGenre")
    default Genre logGenre(Genre genre) {
        if (genre != null) {
            log.info("Mapping Genre: id={}, name={}, description={}", genre.getId(), genre.getName(), genre.getDescription());
        }
        return genre;
    }

    @Named("logGenreResponse")
    default GenreResponse logGenreResponse(GenreResponse response) {
        if (response != null) {
            log.info("Mapped to GenreResponse: id={}, name={}, description={}", response.getId(), response.getName(), response.getDescription());
        }
        return response;
    }

    Genre toGenre(GenreRequest request);

    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    @Mapping(target = "description", source = "description")
    GenreResponse toGenreResponse(Genre genre);

    void updateGenre(@MappingTarget Genre genre, GenreRequest request);
}
