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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/me/accounts")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LinkedAccountController {
    UserService userService;

    @GetMapping
    public ApiResponse<List<LinkedAccountResponse>> getLinkedAccounts() {
        return ApiResponse.<List<LinkedAccountResponse>>builder()
                .message("Linked accounts retrieved successfully")
                .result(userService.getLinkedAccounts())
                .build();
    }

    @PostMapping("/google")
    public ApiResponse<Void> linkGoogleAccount(@RequestBody @Valid GoogleLinkRequest request) {
        userService.linkGoogleAccount(request.getCode(), request.getRedirectUri());
        return ApiResponse.<Void>builder()
                .message("Google account linked successfully")
                .build();
    }

    @PostMapping("/local")
    public ApiResponse<Void> linkLocalAccount(@RequestBody @Valid LinkLocalAccountRequest request) {
        userService.linkLocalAccount(request);
        return ApiResponse.<Void>builder()
                .message("Local account linked successfully")
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> unlinkAccount(@PathVariable String id) {
        userService.unlinkAccount(id);
        return ApiResponse.<Void>builder()
                .message("Account unlinked successfully")
                .build();
    }
}
