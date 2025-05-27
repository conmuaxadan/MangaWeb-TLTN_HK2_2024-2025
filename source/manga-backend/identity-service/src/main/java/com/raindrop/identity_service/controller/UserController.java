package com.raindrop.identity_service.controller;

import com.raindrop.identity_service.dto.request.*;
import com.raindrop.identity_service.dto.response.*;
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

    /**
     * Tìm kiếm người dùng theo từ khóa và phân trang (được nâng cấp để hỗ trợ bộ lọc nâng cao)
     *
     * @param keyword  Từ khóa tìm kiếm
     * @param roleId   ID của vai trò (tùy chọn)
     * @param provider Nhà cung cấp xác thực (tùy chọn)
     * @param enabled  Trạng thái tài khoản (tùy chọn)
     * @param pageable Thông tin phân trang
     * @return Danh sách người dùng phân trang phù hợp với các tiêu chí tìm kiếm và lọc
     */
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<Page<UserResponse>> searchUsers(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "roleId", required = false) Integer roleId,
            @RequestParam(value = "provider", required = false) String provider,
            @RequestParam(value = "enabled", required = false) Boolean enabled,
            @PageableDefault(size = 10, sort = "username") Pageable pageable) {
        log.info("Searching users with advanced filters - keyword: {}, roleId: {}, provider: {}, enabled: {}",
                keyword, roleId, provider, enabled);
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
     *
     * @param jwt  JWT token của người dùng
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
                .message("Avatar updated successfully")
                .result(response)
                .build();
    }

    /**
     * Cập nhật ảnh đại diện của người dùng khác (chỉ dành cho admin)
     *
     * @param userId ID của người dùng cần cập nhật
     * @param file   File ảnh đại diện
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

    /**
     * Xóa ảnh đại diện của người dùng (chỉ dành cho admin)
     *
     * @param userId ID của người dùng cần xóa avatar
     * @return Thông tin người dùng đã cập nhật
     */
    @DeleteMapping("/{userId}/avatar")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<UserResponse> deleteUserAvatar(@PathVariable String userId) {
        log.info("Admin deleting avatar for user {}", userId);

        UserResponse response = userService.deleteAvatar(userId);

        return ApiResponse.<UserResponse>builder()
                .message("Avatar deleted successfully")
                .result(response)
                .build();
    }

    /**
     * Đổi mật khẩu của người dùng hiện tại
     *
     * @param request Yêu cầu đổi mật khẩu
     * @return Thông báo kết quả
     */
    @PostMapping("/password")
    ApiResponse<Void> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        log.info("Change password request received");
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
        log.info("Updating current user {}", userId);

        userService.updateDisplayName(userId, request);
        // Trả về thông tin người dùng đã cập nhật
        return ApiResponse.<Void>builder()
                .message("User updated successfully")
                .build();
    }

    /**
     * Khóa hoặc mở khóa tài khoản người dùng
     *
     * @param request Yêu cầu thay đổi trạng thái
     * @return Thông tin người dùng đã cập nhật
     */
    @PostMapping("/status")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<UserResponse> toggleUserStatus(@RequestBody @Valid ToggleUserStatusRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("User status updated successfully")
                .result(userService.toggleUserStatus(request))
                .build();
    }

    /**
     * Lấy thống kê tổng hợp về người dùng
     *
     * @return Thống kê tổng hợp về người dùng
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    public ApiResponse<UserStatisticsResponse> getUserStatistics() {
        log.info("Getting user statistics");
        return ApiResponse.<UserStatisticsResponse>builder()
                .message("User statistics retrieved successfully")
                .result(userService.getUserStatistics())
                .build();
    }

    /**
     * Lấy tổng số người dùng
     *
     * @return Tổng số người dùng
     */
    @GetMapping("/statistics/total")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    public ApiResponse<Long> getTotalUsers() {
        log.info("Getting total users");
        return ApiResponse.<Long>builder()
                .message("Total users retrieved successfully")
                .result(userService.getUserStatistics().getTotalUsers())
                .build();
    }

    /**
     * Lấy số người dùng mới trong ngày
     *
     * @return Số người dùng mới trong ngày
     */
    @GetMapping("/statistics/today")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    public ApiResponse<Long> getNewUsersToday() {
        log.info("Getting new users today");
        return ApiResponse.<Long>builder()
                .message("New users today retrieved successfully")
                .result(userService.getUserStatistics().getNewUsersToday())
                .build();
    }

    /**
     * Endpoint nội bộ để lấy thông tin email và display name của nhiều người dùng
     * Không yêu cầu authentication cho internal service calls
     */
    @PostMapping("/internal/user/email")
    ApiResponse<UserEmailResponse> getUserInfoById(@RequestBody UserEmailRequest request) {
        return ApiResponse.<UserEmailResponse>builder()
                .message("User retrieved successfully")
                .result(userService.getUserInfoById(request))
                .build();
    }
}
