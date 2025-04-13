package com.raindrop.manga_service.mapper;

import com.raindrop.manga_service.dto.request.MangaRequest;
import com.raindrop.manga_service.dto.response.MangaResponse;
import com.raindrop.manga_service.dto.response.MangaSummaryResponse;
import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Genre;
import com.raindrop.manga_service.entity.Manga;
import org.mapstruct.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface MangaMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "views", ignore = true)
    @Mapping(target = "loves", ignore = true)
    @Mapping(target = "coverUrl", ignore = true) // Xử lý riêng trong service
    @Mapping(target = "genres", ignore = true) // Xử lý riêng trong service
    @Mapping(target = "chapters", ignore = true) // Xử lý riêng trong service
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "lastChapterAddedAt", ignore = true)
    Manga toManga(MangaRequest request);

    @Mapping(target = "genres", source = "genres", qualifiedByName = "genresToStringList")
    @Mapping(target = "chapters", source = "chapters", qualifiedByName = "chaptersToStringList")
    MangaResponse toMangaResponse(Manga manga);

    /**
     * Chuyển đổi Manga thành MangaSummaryResponse
     * @param manga Entity Manga
     * @return MangaSummaryResponse
     */
    @Mapping(target = "lastChapterNumber", expression = "java(getLastChapterNumber(manga))")
    MangaSummaryResponse toMangaSummaryResponse(Manga manga);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "views", ignore = true)
    @Mapping(target = "loves", ignore = true)
    @Mapping(target = "coverUrl", ignore = true) // Xử lý riêng trong service
    @Mapping(target = "genres", ignore = true) // Xử lý riêng trong service
    @Mapping(target = "chapters", ignore = true) // Xử lý riêng trong service
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "lastChapterAddedAt", ignore = true)
    void updateManga(@MappingTarget Manga manga, MangaRequest request);

    @Named("genresToStringList")
    default List<String> genresToStringList(List<Genre> genres) {
        return Optional.ofNullable(genres)
                .orElse(Collections.emptyList())
                .stream()
                .map(Genre::getName)
                .collect(Collectors.toList());
    }

    @Named("chaptersToStringList")
    default List<String> chaptersToStringList(List<Chapter> chapters) {
        return Optional.ofNullable(chapters)
                .orElse(Collections.emptyList())
                .stream()
                .map(Chapter::getId)
                .collect(Collectors.toList());
    }

    /**
     * Lấy số chapter mới nhất của manga
     * @param manga Entity Manga
     * @return Số chapter mới nhất hoặc null nếu không có chapter nào
     */
    default Integer getLastChapterNumber(Manga manga) {
        return Optional.ofNullable(manga.getChapters())
                .orElse(Collections.emptyList())
                .stream()
                .map(Chapter::getChapterNumber)
                .max(Integer::compareTo)
                .orElse(null);
    }
}
