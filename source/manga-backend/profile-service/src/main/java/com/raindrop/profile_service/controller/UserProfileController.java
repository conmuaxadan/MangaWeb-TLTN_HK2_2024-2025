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
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserProfileController {
    UserProfileService userProfileService;

    @PostMapping
    ApiResponse<UserProfileResponse> createProfile(@RequestBody UserProfileRequest request) {
        return ApiResponse.<UserProfileResponse>builder()
                .message("Create profile successfully")
                .result(userProfileService.createProfile(request)).build();
    }

    @GetMapping("/{id}")
    ApiResponse<UserProfileResponse> getProfile(@PathVariable String id) {
        return ApiResponse.<UserProfileResponse>builder()
                .message("Get profile successfully")
                .result(userProfileService.getProfile(id)).build();
    }

    /**
     * Lấy thông tin profile của người dùng theo user ID
     * @param userId ID của người dùng (từ identity service)
     * @return Thông tin profile của người dùng
     */
    @GetMapping("/by-user-id/{userId}")
    ApiResponse<UserProfileResponse> getProfileByUserId(@PathVariable String userId) {
        return ApiResponse.<UserProfileResponse>builder()
                .message("Get profile by user ID successfully")
                .result(userProfileService.getProfileByUserId(userId)).build();
    }

    @GetMapping
    ApiResponse<List<UserProfileResponse>> getAllProfiles() {
        return ApiResponse.<List<UserProfileResponse>>builder()
                .message("Get all profiles successfully")
                .result(userProfileService.getAllProfiles()).build();
    }



}
