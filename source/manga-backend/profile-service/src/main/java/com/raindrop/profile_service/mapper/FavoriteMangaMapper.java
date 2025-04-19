package com.raindrop.profile_service.mapper;

import com.raindrop.profile_service.dto.request.FavoriteRequest;
import com.raindrop.profile_service.dto.response.FavoriteResponse;
import com.raindrop.profile_service.entity.FavoriteManga;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FavoriteMangaMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userProfile", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    FavoriteManga toFavoriteManga(FavoriteRequest request);

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "mangaTitle", ignore = true)
    @Mapping(target = "mangaCoverUrl", ignore = true)
    @Mapping(target = "author", ignore = true)
    @Mapping(target = "description", ignore = true)
    @Mapping(target = "addedAt", source = "createdAt")
    FavoriteResponse toFavoriteResponse(FavoriteManga favoriteManga);
}
