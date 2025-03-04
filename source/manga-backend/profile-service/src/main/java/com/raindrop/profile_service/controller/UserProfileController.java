package com.raindrop.profile_service.controller;

import com.raindrop.profile_service.dto.request.UserProfileRequest;
import com.raindrop.profile_service.dto.response.ApiResponse;
import com.raindrop.profile_service.dto.response.UserProfileResponse;
import com.raindrop.profile_service.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserProfileController {
    UserProfileService userProfileService;

    @PostMapping("users")
    ApiResponse<UserProfileResponse> createProfile(@RequestBody UserProfileRequest request) {
        return ApiResponse.<UserProfileResponse>builder().result(userProfileService.createProfile(request)).build();
    }

    @GetMapping("users/{profileId}")
    ApiResponse<UserProfileResponse> getProfile(@PathVariable String profileId) {
        return ApiResponse.<UserProfileResponse>builder().result(userProfileService.getProfile(profileId)).build();
    }

}
