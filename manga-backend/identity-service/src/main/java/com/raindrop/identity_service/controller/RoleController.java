package com.raindrop.identity_service.controller;

import com.raindrop.identity_service.dto.request.RoleRequest;
import com.raindrop.identity_service.dto.response.ApiResponse;
import com.raindrop.identity_service.dto.response.RoleResponse;
import com.raindrop.identity_service.service.RoleService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class RoleController {
    RoleService roleService;

    @PostMapping
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<RoleResponse> createRole(@RequestBody RoleRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .code(201)
                .message("Role created successfully")
                .result(roleService.create(request))
                .build();
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<List<RoleResponse>> getAllRoles() {
        return ApiResponse.<List<RoleResponse>>builder()
                .message("Roles retrieved successfully")
                .result(roleService.getAll())
                .build();
    }

    @GetMapping("/paginated")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<Page<RoleResponse>> getAllRolesPaginated(
            @PageableDefault(size = 10, sort = "name") Pageable pageable) {
        return ApiResponse.<Page<RoleResponse>>builder()
                .message("Paginated roles retrieved successfully")
                .result(roleService.getAllPaginated(pageable))
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<RoleResponse> getRoleById(@PathVariable Long id) {
        return ApiResponse.<RoleResponse>builder()
                .message("Role retrieved successfully")
                .result(roleService.getById(id))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<Void> delete(@PathVariable Long id) {
        roleService.delete(id);
        return ApiResponse.<Void>builder().message("Role deleted successfully").build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<RoleResponse> updateRole(@PathVariable Long id, @RequestBody RoleRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .message("Role updated successfully")
                .result(roleService.update(id, request))
                .build();
    }
}
