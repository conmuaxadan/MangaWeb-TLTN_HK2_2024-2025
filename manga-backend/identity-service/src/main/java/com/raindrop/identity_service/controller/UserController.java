package com.raindrop.identity_service.controller;

import com.raindrop.identity_service.dto.request.*;
import com.raindrop.identity_service.dto.response.*;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.mapper.UserMapper;
import com.raindrop.identity_service.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class UserController {
    UserService userService;
    UserMapper userMapper;

    @PostMapping
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UserRequest request) {
        return ApiResponse.<UserResponse>builder()
                .code(201)
                .message("User created successfully")
                .result(userService.createUser(request))
                .build();
    }

    @GetMapping()
    ApiResponse<List<UserResponse>> getAllUsers() {
        return ApiResponse.<List<UserResponse>>builder()
                .message("Users retrieved successfully")
                .result(userService.getAllUsers())
                .build();
    }

    @GetMapping("/paginated")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<Page<UserResponse>> getAllUsersPaginated(
            @PageableDefault(size = 10, sort = "username") Pageable pageable) {
        return ApiResponse.<Page<UserResponse>>builder()
                .message("Paginated users retrieved successfully")
                .result(userService.getAllUsersPaginated(pageable))
                .build();
    }

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<Page<UserResponse>> searchUsers(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "roleId", required = false) Integer roleId,
            @RequestParam(value = "provider", required = false) String provider,
            @RequestParam(value = "enabled", required = false) Boolean enabled,
            @PageableDefault(size = 10, sort = "username") Pageable pageable) {
        return ApiResponse.<Page<UserResponse>>builder()
                .message("User search results retrieved successfully")
                .result(userService.searchAndFilterUsers(keyword, roleId, provider, enabled, pageable))
                .build();
    }

//    @GetMapping("/{username}")
//    ApiResponse<UserResponse> getUserByUsername(@PathVariable String username) {
//        return ApiResponse.<UserResponse>builder()
//                .message("User retrieved successfully")
//                .result(userService.getUserByUsername(username))
//                .build();
//    }

    @GetMapping("/{userId}")
    ApiResponse<UserResponse> getUserByUserId(@PathVariable String userId) {
        return ApiResponse.<UserResponse>builder()
                .message("User retrieved successfully")
                .result(userService.getUserById(userId))
                .build();
    }

    @GetMapping("/comment/{userId}")
    ApiResponse<UserCommentResponse> getUserByUserCommentId(@PathVariable String userId) {
        return ApiResponse.<UserCommentResponse>builder()
                .message("User retrieved successfully")
                .result(userService.getUserCommentById(userId))
                .build();
    }
    @PutMapping()
    ApiResponse<UserResponse> updateUser(@RequestBody @Valid UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("User updated successfully")
                .result(userMapper.toUserResponse(userService.updateUser(request)))
                .build();
    }

    @PutMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<UserResponse> updateMyAvatar(
            @AuthenticationPrincipal Jwt jwt,
            @RequestPart("image") MultipartFile file
    ) {
        String userId = jwt.getSubject();
        UserResponse response = userService.updateAvatar(userId, file);

        return ApiResponse.<UserResponse>builder()
                .message("Avatar updated successfully")
                .result(response)
                .build();
    }

    @PutMapping(value = "/{userId}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    ApiResponse<UserResponse> updateUserAvatar(
            @PathVariable String userId,
            @RequestPart("image") MultipartFile file
    ) {
        UserResponse response = userService.updateAvatar(userId, file);

        return ApiResponse.<UserResponse>builder()
                .message("Avatar updated successfully")
                .result(response)
                .build();
    }

    @DeleteMapping("/{username}")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<Void> deleteUser(@PathVariable String username) {
        userService.deleteUserByUsername(username);
        return ApiResponse.<Void>builder()
                .message("User deleted successfully")
                .build();
    }

    @DeleteMapping("/{userId}/avatar")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<UserResponse> deleteUserAvatar(@PathVariable String userId) {
        UserResponse response = userService.deleteAvatar(userId);

        return ApiResponse.<UserResponse>builder()
                .message("Avatar deleted successfully")
                .result(response)
                .build();
    }

    @PutMapping("/me/password")
    ApiResponse<Void> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        userService.changePassword(request);
        return ApiResponse.<Void>builder()
                .message("Password changed successfully")
                .build();
    }

    @PutMapping("/me")
    ApiResponse<Void> changeDisplayName(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody ChangeDisplayNameRequest request
    ) {
        String userId = jwt.getSubject();
        userService.updateDisplayName(userId, request);
        // Trả về thông tin người dùng đã cập nhật
        return ApiResponse.<Void>builder()
                .message("User updated successfully")
                .build();
    }

    @PutMapping("/{userId}/status")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<UserResponse> toggleUserStatus(
            @PathVariable String userId,
            @RequestBody @Valid ToggleUserStatusRequest request) {
        request.setUserId(userId);
        return ApiResponse.<UserResponse>builder()
                .message("User status updated successfully")
                .result(userService.toggleUserStatus(request))
                .build();
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    public ApiResponse<UserStatisticsResponse> getUserStatistics() {
        return ApiResponse.<UserStatisticsResponse>builder()
                .message("User statistics retrieved successfully")
                .result(userService.getUserStatistics())
                .build();
    }

    @GetMapping("/statistics/total")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    public ApiResponse<Long> getTotalUsers() {
        return ApiResponse.<Long>builder()
                .message("Total users retrieved successfully")
                .result(userService.getUserStatistics().getTotalUsers())
                .build();
    }

    @GetMapping("/statistics/daily")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    public ApiResponse<Long> getNewUsersToday() {
        return ApiResponse.<Long>builder()
                .message("New users today retrieved successfully")
                .result(userService.getUserStatistics().getNewUsersToday())
                .build();
    }

    @PostMapping("/internal/user/email")
    ApiResponse<UserEmailResponse> getUserInfoById(@RequestBody UserEmailRequest request) {
        return ApiResponse.<UserEmailResponse>builder()
                .message("User retrieved successfully")
                .result(userService.getUserInfoById(request))
                .build();
    }
}
