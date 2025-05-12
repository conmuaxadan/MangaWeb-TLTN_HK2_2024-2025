package com.raindrop.identity_service.controller;

import com.raindrop.identity_service.dto.request.GoogleLinkRequest;
import com.raindrop.identity_service.dto.request.LinkLocalAccountRequest;
import com.raindrop.identity_service.dto.response.ApiResponse;
import com.raindrop.identity_service.dto.response.LinkedAccountResponse;
import com.raindrop.identity_service.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller xử lý các yêu cầu liên quan đến tài khoản liên kết
 */
@RestController
@RequestMapping("/users/accounts")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class LinkedAccountController {
    UserService userService;

    /**
     * Liên kết tài khoản hiện tại với tài khoản Google
     */
    @PostMapping("/google")
    public ApiResponse<Void> linkGoogleAccount(@RequestBody @Valid GoogleLinkRequest request) {
        log.info("Linking Google account with redirect URI: {}", request.getRedirectUri());
        userService.linkGoogleAccount(request.getCode(), request.getRedirectUri());
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Google account linked successfully")
                .build();
    }

    /**
     * Liên kết tài khoản hiện tại với tài khoản Local mới
     */
    @PostMapping("/local")
    public ApiResponse<Void> linkLocalAccount(@RequestBody @Valid LinkLocalAccountRequest request) {
        log.info("Linking local account with username: {}", request.getUsername());
        userService.linkLocalAccount(request);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Local account linked successfully")
                .build();
    }

    /**
     * Lấy danh sách tài khoản đã liên kết
     */
    @GetMapping
    public ApiResponse<List<LinkedAccountResponse>> getLinkedAccounts() {
        log.info("Getting linked accounts for current user");
        List<LinkedAccountResponse> accounts = userService.getLinkedAccounts();
        return ApiResponse.<List<LinkedAccountResponse>>builder()
                .code(1000)
                .message("Linked accounts retrieved successfully")
                .result(accounts)
                .build();
    }

    /**
     * Hủy liên kết tài khoản
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> unlinkAccount(@PathVariable String id) {
        log.info("Unlinking account with ID: {}", id);
        userService.unlinkAccount(id);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Account unlinked successfully")
                .build();
    }
}
