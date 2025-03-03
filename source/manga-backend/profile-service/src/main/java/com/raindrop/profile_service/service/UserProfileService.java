package com.raindrop.profile_service.service;

import com.raindrop.profile_service.dto.request.UserProfileRequest;
import com.raindrop.profile_service.dto.response.UserProfileResponse;
import com.raindrop.profile_service.entity.UserProfile;
import com.raindrop.profile_service.mapper.UserProfileMapper;
import com.raindrop.profile_service.repository.UserProfileRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserProfileService {
    UserProfileRepository userProfileRepository;
    UserProfileMapper userProfileMapper;

    public UserProfileResponse createProfile(UserProfileRequest userProfileRequest) {
        UserProfile userProfile = userProfileMapper.toUserProfile(userProfileRequest);
        userProfileRepository.save(userProfile);
        return userProfileMapper.toUserProfileResponse(userProfile);
    }

    public UserProfileResponse getProfile(String id) {
        UserProfile userProfile = userProfileRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        return userProfileMapper.toUserProfileResponse(userProfile);
    }
}
