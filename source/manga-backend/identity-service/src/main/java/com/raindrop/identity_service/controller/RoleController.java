package com.raindrop.identity_service.controller;

import com.raindrop.identity_service.dto.request.PermissionRequest;
import com.raindrop.identity_service.dto.request.RoleRequest;
import com.raindrop.identity_service.dto.response.ApiResponse;
import com.raindrop.identity_service.dto.response.PermissionResponse;
import com.raindrop.identity_service.dto.response.RoleResponse;
import com.raindrop.identity_service.service.RoleService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class RoleController {
    RoleService roleService;

    @PostMapping
    ApiResponse<RoleResponse> createPermission(@RequestBody RoleRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.create(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<RoleResponse>> getAllPermissions() {
        return ApiResponse.<List<RoleResponse>>builder()
                .result(roleService.getAll())
                .build();
    }

    @DeleteMapping("/{id}")
    ApiResponse<Void> delete(@PathVariable String id) {
        roleService.delete(id);
        return ApiResponse.<Void>builder().build();
    }
}
