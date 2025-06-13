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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class RoleService {
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RoleMapper roleMapper;

    public RoleResponse create(RoleRequest request) {
        var role = roleMapper.toRole(request);
        var permissions = permissionRepository.findAllById(request.getPermissions());
        role.setPermissions(new HashSet<>(permissions));
        role.setDescription(request.getDescription());
        roleRepository.save(role);

        return roleMapper.toRoleResponse(role);
    }

    public List<RoleResponse> getAll() {
        var roles = roleRepository.findAll();
        return roles.stream().map(roleMapper::toRoleResponse).toList();
    }

    public Page<RoleResponse> getAllPaginated(Pageable pageable) {
        Page<Role> rolesPage = roleRepository.findAll(pageable);
        Page<RoleResponse> roleResponsePage = rolesPage.map(roleMapper::toRoleResponse);
        return roleResponsePage;
    }

    public void delete(Long id) {
        roleRepository.deleteById(id);
    }

    public RoleResponse getById(Long id) {
        var role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
        return roleMapper.toRoleResponse(role);
    }

    public RoleResponse update(Long id, RoleRequest request) {
        var role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));

        // Update fields
        role.setName(request.getName());
        role.setDescription(request.getDescription());

        // Update permissions
        var permissions = permissionRepository.findAllById(request.getPermissions());
        role.setPermissions(new HashSet<>(permissions));

        roleRepository.save(role);

        return roleMapper.toRoleResponse(role);
    }
}
