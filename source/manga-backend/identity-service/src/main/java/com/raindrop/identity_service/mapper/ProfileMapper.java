package com.raindrop.identity_service.mapper;

import com.raindrop.identity_service.dto.request.UserProfileRequest;
import com.raindrop.identity_service.dto.request.UserRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProfileMapper {
    @Mapping(target = "displayName", source = "username")
    @Mapping(target = "avatarUrl", constant = "null")
    UserProfileRequest toUserProfileRequest(UserRequest request);
}
