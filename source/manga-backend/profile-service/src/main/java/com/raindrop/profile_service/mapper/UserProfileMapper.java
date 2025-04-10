package com.raindrop.profile_service.mapper;

import com.raindrop.profile_service.dto.request.UserProfileRequest;
import com.raindrop.profile_service.dto.response.UserProfileResponse;
import com.raindrop.profile_service.entity.UserProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserProfileMapper {
    @Mapping(target = "email", source = "email")
    UserProfile toUserProfile(UserProfileRequest userProfileRequest);
    @Mapping(target = "id", source = "id")
    UserProfileResponse toUserProfileResponse(UserProfile userProfile);
}
