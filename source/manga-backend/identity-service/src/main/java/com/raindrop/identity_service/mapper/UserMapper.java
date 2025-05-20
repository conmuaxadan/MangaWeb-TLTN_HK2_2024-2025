package com.raindrop.identity_service.mapper;

import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.UserResponse;
import com.raindrop.identity_service.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

/**
 * Mapper cho User entity
 */
@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {
    /**
     * Chuyển đổi từ UserRequest sang User
     * @param request UserRequest
     * @return User
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "authProvider", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    User toUser(UserRequest request);

    /**
     * Chuyển đổi từ User sang UserResponse
     * @param user User
     * @return UserResponse
     */
    @Mapping(target = "id", source = "id")
    @Mapping(target = "username", source = "username")
    @Mapping(target = "email", source = "email")
    @Mapping(target = "displayName", source = "displayName")
    @Mapping(target = "avatarUrl", source = "avatarUrl")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "enabled", source = "enabled")
    UserResponse toUserResponse(User user);

    /**
     * Cập nhật User từ UserRequest
     * @param user User cần cập nhật
     * @param request UserRequest chứa thông tin cập nhật
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "authProvider", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "password", ignore = true) // Xử lý riêng trong service
    @Mapping(target = "email", ignore = true) // Không cho phép cập nhật email
    @Mapping(target = "username", ignore = true) // Không cho phép cập nhật username
    void updateUser(@MappingTarget User user, UserRequest request);
}
