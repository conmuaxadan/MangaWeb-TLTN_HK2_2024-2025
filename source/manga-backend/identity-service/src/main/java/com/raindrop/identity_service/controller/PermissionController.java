package com.raindrop.identity_service.controller;

import com.raindrop.identity_service.dto.request.PermissionRequest;
import com.raindrop.identity_service.dto.response.ApiResponse;
import com.raindrop.identity_service.dto.response.PermissionResponse;
import com.raindrop.identity_service.service.PermissionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class PermissionController {
    PermissionService permissionService;

    @PostMapping
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<PermissionResponse> createPermission(@RequestBody PermissionRequest request) {
        return ApiResponse.<PermissionResponse>builder()
                .code(201)
                .message("Permission created successfully")
                .result(permissionService.create(request))
                .build();
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<List<PermissionResponse>> getAllPermissions() {
        return ApiResponse.<List<PermissionResponse>>builder()
                .message("Permissions retrieved successfully")
                .result(permissionService.getAll())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<PermissionResponse> getPermissionById(@PathVariable Long id) {
        return ApiResponse.<PermissionResponse>builder()
                .message("Permission retrieved successfully")
                .result(permissionService.getById(id))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<Void> deleteById(@PathVariable Long id) {
        permissionService.delete(id);
        return ApiResponse.<Void>builder().message("Permission deleted successfully").build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<PermissionResponse> updatePermission(@PathVariable Long id, @RequestBody PermissionRequest request) {
        return ApiResponse.<PermissionResponse>builder()
                .message("Permission updated successfully")
                .result(permissionService.update(id, request))
                .build();
    }
}
