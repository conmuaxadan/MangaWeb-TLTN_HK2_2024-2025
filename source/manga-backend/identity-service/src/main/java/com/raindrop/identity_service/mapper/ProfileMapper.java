package com.raindrop.identity_service.mapper;

import com.raindrop.identity_service.dto.request.UserProfileRequest;
import com.raindrop.identity_service.dto.request.UserRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProfileMapper {
    @Mapping(target = "displayName", expression = "java(getDisplayName(request))")
    @Mapping(target = "avatarUrl", constant = "null")
    @Mapping(target = "email", source = "email")
    UserProfileRequest toUserProfileRequest(UserRequest request);

    default String getDisplayName(UserRequest request) {
        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            return request.getUsername();
        } else {
            String email = request.getEmail();
            return email != null ? email.split("@")[0] : null;
        }
    }
}
