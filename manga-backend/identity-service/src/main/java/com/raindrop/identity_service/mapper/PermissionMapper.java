package com.raindrop.identity_service.mapper;

import com.raindrop.identity_service.dto.request.PermissionRequest;
import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.PermissionResponse;
import com.raindrop.identity_service.dto.response.UserResponse;
import com.raindrop.identity_service.entity.Permission;
import com.raindrop.identity_service.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;


@Mapper(componentModel = "spring")
public interface PermissionMapper {
    @Mapping(target = "description", source = "description")
    Permission toPermission(PermissionRequest request);
    @Mapping(target = "description", source = "description")
    PermissionResponse toPermissionResponse(Permission permission);
}
