package com.raindrop.profile_service.controller;

import com.raindrop.profile_service.dto.request.UserProfileRequest;
import com.raindrop.profile_service.dto.response.ApiResponse;
import com.raindrop.profile_service.dto.response.UserProfileResponse;
import com.raindrop.profile_service.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserProfileController {
    UserProfileService userProfileService;

    @PostMapping("users")
    ApiResponse<UserProfileResponse> createProfile(@RequestBody UserProfileRequest request) {
        return ApiResponse.<UserProfileResponse>builder()
                .message("Create profile successfully")
                .result(userProfileService.createProfile(request)).build();
    }

    @GetMapping("users/{profileId}")
    ApiResponse<UserProfileResponse> getProfile(@PathVariable String profileId) {
        return ApiResponse.<UserProfileResponse>builder()
                .message("Get profile successfully")
                .result(userProfileService.getProfile(profileId)).build();
    }

    @GetMapping("users")
    ApiResponse<List<UserProfileResponse>> getAllProfiles() {
        return ApiResponse.<List<UserProfileResponse>>builder()
                .message("Get all profiles successfully")
                .result(userProfileService.getAllProfiles()).build();
    }

}
