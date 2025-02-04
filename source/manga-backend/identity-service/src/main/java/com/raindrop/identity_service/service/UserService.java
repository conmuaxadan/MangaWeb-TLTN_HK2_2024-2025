package com.raindrop.identity_service.service;

import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.UserResponse;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.exception.AppException;
import com.raindrop.identity_service.exception.ErrorCode;
import com.raindrop.identity_service.mapper.IUserMapper;
import com.raindrop.identity_service.repository.IUserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class UserService {
    IUserRepository userRepository;
    IUserMapper userMapper;

    public UserResponse createUser(UserRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        User user = userMapper.toUser(request);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        return userMapper.toUserResponse(userRepository.save(user));
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(userMapper::toUserResponse).collect(Collectors.toList());
    }

    public UserResponse getUserByUsername(String username) {
        return userMapper.toUserResponse(userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found")));
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
        userMapper.updateUser(user, request);
        user.setPassword(new BCryptPasswordEncoder(10).encode(request.getPassword()));
        return userRepository.save(user);
    }

    public void deleteUser(UserRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }
}
