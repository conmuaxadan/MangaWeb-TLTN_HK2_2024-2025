package com.raindrop.identity_service.controller;

import com.raindrop.identity_service.dto.request.ChangeDisplayNameRequest;
import com.raindrop.identity_service.dto.request.ChangePasswordRequest;
import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.ApiResponse;
import com.raindrop.identity_service.dto.response.UserCommentResponse;
import com.raindrop.identity_service.dto.response.UserResponse;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.mapper.UserMapper;
import com.raindrop.identity_service.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class UserController {
     UserService userService;
     UserMapper userMapper;

    @PostMapping
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UserRequest request) {
        return ApiResponse.<UserResponse>builder()
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
    ApiResponse<Page<UserResponse>> getAllUsersPaginated(
            @PageableDefault(size = 10, sort = "username") Pageable pageable) {
        return ApiResponse.<Page<UserResponse>>builder()
                .message("Paginated users retrieved successfully")
                .result(userService.getAllUsersPaginated(pageable))
                .build();
    }

    @GetMapping("/{username}")
    ApiResponse<UserResponse> getUserByUsername(@PathVariable String username) {
        return ApiResponse.<UserResponse>builder()
                .message("User retrieved successfully")
                .result(userService.getUserByUsername(username))
                .build();
    }

    @GetMapping("/id/{userId}")
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
    ApiResponse<UserResponse> updateUser(@RequestBody UserRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("User updated successfully")
                .result(userMapper.toUserResponse(userService.updateUser(request)))
                .build();
    }

    /**
     * Cập nhật ảnh đại diện của người dùng hiện tại
     * @param jwt JWT token của người dùng
     * @param file File ảnh đại diện
     * @return Thông tin người dùng đã cập nhật
     */
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<UserResponse> updateMyAvatar(
            @AuthenticationPrincipal Jwt jwt,
            @RequestPart("image") MultipartFile file
    ) {
        String userId = jwt.getSubject();
        log.info("Updating avatar for current user {}", userId);

        UserResponse response = userService.updateAvatar(userId, file);

        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .message("Avatar updated successfully")
                .result(response)
                .build();
    }

    /**
     * Cập nhật ảnh đại diện của người dùng khác (chỉ dành cho admin)
     * @param userId ID của người dùng cần cập nhật
     * @param file File ảnh đại diện
     * @return Thông tin người dùng đã cập nhật
     */
    @PostMapping(value = "/{userId}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    ApiResponse<UserResponse> updateUserAvatar(
            @PathVariable String userId,
            @RequestPart("image") MultipartFile file
    ) {
        log.info("Admin updating avatar for user {}", userId);

        UserResponse response = userService.updateAvatar(userId, file);

        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .message("Avatar updated successfully")
                .result(response)
                .build();
    }

    @DeleteMapping("/{username}")
    ApiResponse<Void> deleteUser(@PathVariable String username) {
        userService.deleteUserByUsername(username);
        return ApiResponse.<Void>builder()
                .message("User deleted successfully")
                .build();
    }

    /**
     * Xóa ảnh đại diện của người dùng (chỉ dành cho admin)
     * @param userId ID của người dùng cần xóa avatar
     * @return Thông tin người dùng đã cập nhật
     */
    @DeleteMapping("/{userId}/avatar")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    ApiResponse<UserResponse> deleteUserAvatar(@PathVariable String userId) {
        log.info("Admin deleting avatar for user {}", userId);

        UserResponse response = userService.deleteAvatar(userId);

        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .message("Avatar deleted successfully")
                .result(response)
                .build();
    }

    /**
     * Đổi mật khẩu của người dùng hiện tại
     * @param request Yêu cầu đổi mật khẩu
     * @return Thông báo kết quả
     */
    @PostMapping("/password")
    ApiResponse<Void> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        log.info("Change password request received");
        userService.changePassword(request);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Password changed successfully")
                .build();
    }

    @PutMapping("/me")
    ApiResponse<Void> changeDisplayName(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody ChangeDisplayNameRequest request
    ) {
        String userId = jwt.getSubject();
        log.info("Updating current user {}", userId);

        userService.updateDisplayName(userId, request);
        // Trả về thông tin người dùng đã cập nhật
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("User updated successfully")
                .build();
    }
}
