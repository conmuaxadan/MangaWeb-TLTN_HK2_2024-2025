package com.raindrop.identity_service.controller;

import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.ApiResponse;
import com.raindrop.identity_service.dto.response.UserResponse;
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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class UserController {
     UserService userService;
     UserMapper userMapper;

    @PostMapping("/register")
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

    /**
     * Lấy danh sách người dùng có phân trang
     * @param pageable Thông tin phân trang
     * @return Danh sách người dùng có phân trang
     */
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

    @PutMapping()
    ApiResponse<UserResponse> updateUser(@RequestBody UserRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("User updated successfully")
                .result(userMapper.toUserResponse(userService.updateUser(request)))
                .build();
    }

    @DeleteMapping()
    ApiResponse<Void> deleteUser(@RequestBody UserRequest request) {
        userService.deleteUser(request);
        return ApiResponse.<Void>builder()
                .message("User deleted successfully")
                .build();
    }

    @GetMapping("/myInfo")
    ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .message("User retrieved successfully")
                .result(userService.getMyInfo())
                .build();
    }
}
