package com.raindrop.identity_service.service;

import com.raindrop.identity_service.dto.request.RoleRequest;
import com.raindrop.identity_service.dto.response.RoleResponse;
import com.raindrop.identity_service.entity.Role;
import com.raindrop.identity_service.mapper.RoleMapper;
import com.raindrop.identity_service.repository.PermissionRepository;
import com.raindrop.identity_service.repository.RoleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class RoleService {
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RoleMapper roleMapper;

    public RoleResponse create(RoleRequest request) {
        var role = roleMapper.toRole(request);
        var permissions = permissionRepository.findAllById(request.getPermissions());
        role.setPermissions(new HashSet<>(permissions));
        roleRepository.save(role);

        return roleMapper.toRoleResponse(role);
    }

    public List<RoleResponse> getAll() {
        log.info("Getting all roles");
        var roles = roleRepository.findAll();
        log.info("Retrieved {} roles", roles.size());
        return roles.stream().map(roleMapper::toRoleResponse).toList();
    }

    /**
     * Lấy danh sách role có phân trang
     * @param pageable Thông tin phân trang
     * @return Danh sách role có phân trang
     */
    public Page<RoleResponse> getAllPaginated(Pageable pageable) {
        log.info("Getting paginated roles with page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Role> rolesPage = roleRepository.findAll(pageable);
        Page<RoleResponse> roleResponsePage = rolesPage.map(roleMapper::toRoleResponse);
        log.info("Retrieved {} roles out of {} total", roleResponsePage.getNumberOfElements(), roleResponsePage.getTotalElements());
        return roleResponsePage;
    }

    public void delete(String role) {
        roleRepository.deleteById(role);
    }
}
