package com.raindrop.identity_service.controller;

import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.ApiResponse;
import com.raindrop.identity_service.dto.response.UserResponse;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.mapper.IUserMapper;
import com.raindrop.identity_service.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.extern.slf4j.Slf4j;
import org.mapstruct.factory.Mappers;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class UserController {
     UserService userService;
     IUserMapper userMapper;

    @PostMapping()
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UserRequest request) {
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setResult(userService.createUser(request));
        return response;
    }
    
    @GetMapping()
    ApiResponse<List<UserResponse>> getAllUsers() {
        var authentication =  SecurityContextHolder.getContext().getAuthentication();

        log.info("User: {}", authentication.getName());
        log.info("Roles: {}", authentication.getAuthorities().stream().map(Object::toString).collect(Collectors.joining(", ")));

        ApiResponse<List<UserResponse>> response = new ApiResponse<>();
        response.setResult(userService.getAllUsers());
        return response;
    }

    @GetMapping("/{username}")
    ApiResponse<UserResponse> getUserByUsername(@PathVariable String username) {
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setResult(userService.getUserByUsername(username));
        return response;
    }

    @PutMapping()
    ApiResponse<UserResponse> updateUser(@RequestBody UserRequest request) {
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setResult(userMapper.toUserResponse(userService.updateUser(request)));
        return response;
    }

    @DeleteMapping()
    ApiResponse<String> deleteUser(@RequestBody UserRequest request) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            userService.deleteUser(request);
            response.setMessage("User deleted");
        } catch (Exception e) {
        }
        return response;
    }

    @GetMapping("/myInfo")
    ApiResponse<UserResponse> getMyInfo() {
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setResult(userService.getMyInfo());
        return response;
    }
}
