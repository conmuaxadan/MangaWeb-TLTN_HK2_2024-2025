package com.raindrop.identity_service.mapper;

import com.raindrop.identity_service.dto.request.RoleRequest;
import com.raindrop.identity_service.dto.response.RoleResponse;
import com.raindrop.identity_service.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    @Mapping(target = "permissions", ignore = true)
    @Mapping(target = "description", source = "description")
    Role toRole(RoleRequest request);

    @Mapping(target = "description", source = "description")
    RoleResponse toRoleResponse(Role role);
}
