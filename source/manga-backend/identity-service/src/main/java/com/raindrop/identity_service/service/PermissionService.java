package com.raindrop.identity_service.service;

import com.raindrop.identity_service.dto.request.PermissionRequest;
import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.PermissionResponse;
import com.raindrop.identity_service.entity.Permission;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.mapper.PermissionMapper;
import com.raindrop.identity_service.repository.PermissionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class PermissionService {
    PermissionRepository permissionRepository;
    PermissionMapper permissionMapper;

    public PermissionResponse create(PermissionRequest request) {
        log.info("Creating permission with name: {} and description: {}", request.getName(), request.getDescription());
        Permission permission = permissionMapper.toPermission(request);
        permission = permissionRepository.save(permission);
        return permissionMapper.toPermissionResponse(permission);
    }

    public List<PermissionResponse> getAll() {
        List<Permission> permissions = permissionRepository.findAll();
        return permissions.stream().map(permissionMapper::toPermissionResponse).toList();
    }

    public void delete(Long id) {
        permissionRepository.deleteById(id);
    }

    public PermissionResponse update(Long id, PermissionRequest request) {
        log.info("Updating permission with id: {}, name: {} and description: {}", id, request.getName(), request.getDescription());

        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission not found with id: " + id));

        // Update fields
        permission.setDescription(request.getDescription());
        // Note: We don't update the name field as it might be used as a key in other places

        permission = permissionRepository.save(permission);
        return permissionMapper.toPermissionResponse(permission);
    }
}
