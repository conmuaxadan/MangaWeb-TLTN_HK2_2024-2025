package com.raindrop.profile_service.controller;

import com.raindrop.profile_service.dto.request.UpdateProfileRequest;
import com.raindrop.profile_service.dto.request.UserProfileRequest;
import com.raindrop.profile_service.dto.response.ApiResponse;
import com.raindrop.profile_service.dto.response.FileInfoResponse;
import com.raindrop.profile_service.dto.response.UserProfileResponse;
import com.raindrop.profile_service.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
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

    /**
     * Cập nhật thông tin profile của người dùng hiện tại
     * @param jwt JWT token của người dùng
     * @param request Thông tin cần cập nhật
     * @return Thông tin profile đã cập nhật
     */
    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    ApiResponse<UserProfileResponse> updateMyProfile(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid UpdateProfileRequest request
    ) {
        String userId = jwt.getSubject();
        log.info("Updating profile for user {}", userId);

        UserProfileResponse response = userProfileService.updateProfile(userId, request);

        return ApiResponse.<UserProfileResponse>builder()
                .code(1000)
                .message("Profile updated successfully")
                .result(response)
                .build();
    }

    /**
     * Cập nhật ảnh đại diện của người dùng hiện tại
     * @param jwt JWT token của người dùng
     * @param file File ảnh đại diện
     * @return Thông tin profile đã cập nhật
     */
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    ApiResponse<UserProfileResponse> updateMyAvatar(
            @AuthenticationPrincipal Jwt jwt,
            @RequestPart("file") MultipartFile file
    ) {
        String userId = jwt.getSubject();
        log.info("Updating avatar for user {}", userId);

        UserProfileResponse response = userProfileService.updateAvatar(userId, file);

        return ApiResponse.<UserProfileResponse>builder()
                .code(1000)
                .message("Avatar updated successfully")
                .result(response)
                .build();
    }

}
