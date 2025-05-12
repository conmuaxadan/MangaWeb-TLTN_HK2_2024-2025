package com.raindrop.profile_service.mapper;

import com.raindrop.profile_service.dto.request.ProfileRequest;
import com.raindrop.profile_service.dto.response.ProfileResponse;
import com.raindrop.profile_service.entity.Profile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProfileMapper {
    @Mapping(target = "id", source = "userId")
    @Mapping(target = "email", source = "email")
    Profile toUserProfile(ProfileRequest profileRequest);
    @Mapping(target = "id", source = "id")
    ProfileResponse toUserProfileResponse(Profile profile);
}
