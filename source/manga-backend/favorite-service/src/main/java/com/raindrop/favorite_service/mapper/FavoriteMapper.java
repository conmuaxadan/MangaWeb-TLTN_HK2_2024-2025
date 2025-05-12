package com.raindrop.favorite_service.mapper;

import com.raindrop.favorite_service.dto.request.FavoriteRequest;
import com.raindrop.favorite_service.dto.response.FavoriteResponse;
import com.raindrop.favorite_service.entity.Favorite;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FavoriteMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Favorite toFavorite(FavoriteRequest request);

    @Mapping(target = "mangaTitle", ignore = true)
    @Mapping(target = "mangaCoverUrl", ignore = true)
    @Mapping(target = "author", ignore = true)
    @Mapping(target = "description", ignore = true)
    @Mapping(target = "addedAt", source = "createdAt")
    FavoriteResponse toFavoriteResponse(Favorite favorite);
}
