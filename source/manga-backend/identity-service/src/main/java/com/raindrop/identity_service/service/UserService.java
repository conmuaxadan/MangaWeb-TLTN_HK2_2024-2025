package com.raindrop.identity_service.service;

import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.UserResponse;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.enums.Role;
import com.raindrop.identity_service.exception.AppException;
import com.raindrop.identity_service.exception.ErrorCode;
import com.raindrop.identity_service.mapper.UserMapper;
import com.raindrop.identity_service.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class UserService {
    UserRepository userRepository;
    UserMapper UserMapper;
    PasswordEncoder passwordEncoder;

    public UserResponse createUser(UserRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        User user = UserMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        HashSet<String> roles = new HashSet<>();
        roles.add(Role.USER.name());
//        user.setRoles(roles);
        return UserMapper.toUserResponse(userRepository.save(user));
    }
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getAllUsers() {
        log.info("Getting all users");
        return userRepository.findAll().stream().map(UserMapper::toUserResponse).collect(Collectors.toList());
    }

    @PostAuthorize("returnObject.username == authentication.name")
    public UserResponse getUserByUsername(String username) {
        return UserMapper.toUserResponse(userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found")));
    }

    public User updateUser(UserRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> new RuntimeException("User not found"));
        if (request.getPassword() == null && request.getEmail() == null) {
            throw new RuntimeException("At least one of password or email must be provided");
        }
//        if (request.getPassword() != null) {
//            user.setPassword(request.getPassword());
//        }
//        if (request.getEmail() != null) {
//            user.setEmail(request.getEmail());
//        }
        UserMapper.updateUser(user, request);
        user.setPassword(new BCryptPasswordEncoder(10).encode(request.getPassword()));
        return userRepository.save(user);
    }

    public void deleteUser(UserRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }

    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();
        User user = userRepository.findByUsername(name).orElseThrow(() -> new RuntimeException("User not found"));
        return UserMapper.toUserResponse(user);
    }
}
