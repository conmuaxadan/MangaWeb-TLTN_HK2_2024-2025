package com.raindrop.profile_service.controller;

import com.raindrop.profile_service.dto.request.ProfileRequest;
import com.raindrop.profile_service.dto.request.UpdateProfileRequest;
import com.raindrop.profile_service.dto.response.ApiResponse;
import com.raindrop.profile_service.dto.response.ProfileResponse;
import com.raindrop.profile_service.service.ProfileService;
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
@RequestMapping("/profiles")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ProfileController {
    ProfileService profileService;

    @PostMapping
    ApiResponse<ProfileResponse> createProfile(@RequestBody ProfileRequest request) {
        return ApiResponse.<ProfileResponse>builder()
                .message("Create profile successfully")
                .result(profileService.createProfile(request)).build();
    }

    @GetMapping("/{id}")
    ApiResponse<ProfileResponse> getProfile(@PathVariable String id) {
        return ApiResponse.<ProfileResponse>builder()
                .message("Get profile successfully")
                .result(profileService.getProfile(id)).build();
    }

    /**
     * Lấy thông tin profile của người dùng theo user ID
     * @param userId ID của người dùng (từ identity service)
     * @return Thông tin profile của người dùng
     */
    @GetMapping("/by-user-id/{userId}")
    ApiResponse<ProfileResponse> getProfileByUserId(@PathVariable String userId) {
        return ApiResponse.<ProfileResponse>builder()
                .message("Get profile by user ID successfully")
                .result(profileService.getProfileByUserId(userId)).build();
    }

    @GetMapping
    ApiResponse<List<ProfileResponse>> getAllProfiles() {
        return ApiResponse.<List<ProfileResponse>>builder()
                .message("Get all profiles successfully")
                .result(profileService.getAllProfiles()).build();
    }

    /**
     * Cập nhật thông tin profile của người dùng hiện tại
     * @param jwt JWT token của người dùng
     * @param request Thông tin cần cập nhật
     * @return Thông tin profile đã cập nhật
     */
    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    ApiResponse<ProfileResponse> updateMyProfile(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid UpdateProfileRequest request
    ) {
        String userId = jwt.getSubject();
        log.info("Updating profile for user {}", userId);

        ProfileResponse response = profileService.updateProfile(userId, request);

        return ApiResponse.<ProfileResponse>builder()
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
    ApiResponse<ProfileResponse> updateMyAvatar(
            @AuthenticationPrincipal Jwt jwt,
            @RequestPart("image") MultipartFile file
    ) {
        String userId = jwt.getSubject();
        log.info("Updating avatar for user {}", userId);

        ProfileResponse response = profileService.updateAvatar(userId, file);

        return ApiResponse.<ProfileResponse>builder()
                .code(1000)
                .message("Avatar updated successfully")
                .result(response)
                .build();
    }

}
