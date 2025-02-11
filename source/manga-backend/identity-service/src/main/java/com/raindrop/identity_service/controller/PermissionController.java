package com.raindrop.identity_service.controller;

import com.raindrop.identity_service.dto.request.PermissionRequest;
import com.raindrop.identity_service.dto.response.ApiResponse;
import com.raindrop.identity_service.dto.response.PermissionResponse;
import com.raindrop.identity_service.service.PermissionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class PermissionController {
    PermissionService permissionService;

    @PostMapping
    ApiResponse<PermissionResponse> createPermission(@RequestBody PermissionRequest request) {
        return ApiResponse.<PermissionResponse>builder()
                .result(permissionService.create(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<PermissionResponse>> getAllPermissions() {
        return ApiResponse.<List<PermissionResponse>>builder()
                .result(permissionService.getAll())
                .build();
    }

    @DeleteMapping("/{id}")
    ApiResponse<Void> delete(@PathVariable String id) {
        permissionService.delete(id);
        return ApiResponse.<Void>builder().build();
    }
}
