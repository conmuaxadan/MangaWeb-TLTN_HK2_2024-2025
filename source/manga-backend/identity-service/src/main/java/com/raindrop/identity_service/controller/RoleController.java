package com.raindrop.identity_service.controller;

import com.raindrop.identity_service.dto.request.RoleRequest;
import com.raindrop.identity_service.dto.response.ApiResponse;
import com.raindrop.identity_service.dto.response.RoleResponse;
import com.raindrop.identity_service.service.RoleService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
                .message("Role created successfully")
                .result(roleService.create(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<RoleResponse>> getAllPermissions() {
        return ApiResponse.<List<RoleResponse>>builder()
                .message("Roles retrieved successfully")
                .result(roleService.getAll())
                .build();
    }

    /**
     * Lấy danh sách role có phân trang
     * @param pageable Thông tin phân trang
     * @return Danh sách role có phân trang
     */
    @GetMapping("/paginated")
    ApiResponse<Page<RoleResponse>> getAllRolesPaginated(
            @PageableDefault(size = 10, sort = "name") Pageable pageable) {
        return ApiResponse.<Page<RoleResponse>>builder()
                .message("Paginated roles retrieved successfully")
                .result(roleService.getAllPaginated(pageable))
                .build();
    }

    @DeleteMapping("/{id}")
    ApiResponse<Void> delete(@PathVariable String id) {
        roleService.delete(id);
        return ApiResponse.<Void>builder().message("Role deleted successfully").build();
    }
}
