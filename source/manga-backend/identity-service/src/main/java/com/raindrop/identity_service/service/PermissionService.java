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
        Permission permission = permissionMapper.toPermission(request);
        permission = permissionRepository.save(permission);
        return permissionMapper.toPermissionResponse(permission);

    }

    public List<PermissionResponse> getAll() {
        List<Permission> permissions = permissionRepository.findAll();
        return permissions.stream().map(permissionMapper::toPermissionResponse).toList();
    }

    public void delete(String id) {
        permissionRepository.deleteById(id);

    }
}
