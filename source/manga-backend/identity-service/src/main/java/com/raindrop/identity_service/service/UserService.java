package com.raindrop.identity_service.service;

import com.raindrop.common.event.UserProfileEvent;
import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.UserResponse;
import com.raindrop.identity_service.entity.Role;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.exception.AppException;
import com.raindrop.identity_service.enums.ErrorCode;
import com.raindrop.identity_service.mapper.ProfileMapper;
import com.raindrop.identity_service.mapper.UserMapper;
import com.raindrop.identity_service.repository.RoleRepository;
import com.raindrop.identity_service.repository.UserRepository;
import com.raindrop.identity_service.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import com.raindrop.identity_service.kafka.UserProfileEventProducer;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;
    ProfileClient profileClient;
    ProfileMapper profileMapper;
    UserProfileEventProducer userProfileEventProducer;


    public UserResponse createUser(UserRequest request) {
        log.info("Creating new user: {}", request.getUsername());

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            log.warn("User creation failed: Username already exists - {}", request.getUsername());
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Assign default role
        var roles = new HashSet<Role>();
        roles.add(Role.builder().name("USER").build());
        user.setRoles(roles);

        log.debug("Saving user to database: {}", request.getUsername());
        user = userRepository.save(user);
        log.info("User saved successfully with ID: {}", user.getId());

        // Prepare profile data
        var profileRequest = profileMapper.toUserProfileRequest(request);
        profileRequest.setUserId(user.getId());

        UserProfileEvent profileEvent = UserProfileEvent.builder()
                .userId(profileRequest.getUserId())
                .email(profileRequest.getEmail())
                .displayName(profileRequest.getDisplayName())
                .avatarUrl(profileRequest.getAvatarUrl())
                .build();

        log.info("Creating user profile for user: {}", profileEvent.getEmail());

//        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
//        var header = attributes.getRequest().getHeader("Authorization");
//        profileClient.createProfile(header,profileRequest);

        //Publish message to Kafka
        userProfileEventProducer.sendUserProfileEvent(profileEvent);

        return userMapper.toUserResponse(user);
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public List<UserResponse> getAllUsers() {
        log.info("Getting all users");
        List<UserResponse> users = userRepository.findAll().stream().map(userMapper::toUserResponse).collect(Collectors.toList());
        log.info("Retrieved {} users", users.size());
        return users;
    }

    /**
     * Lấy danh sách người dùng có phân trang
     * @param pageable Thông tin phân trang
     * @return Danh sách người dùng có phân trang
     */
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Page<UserResponse> getAllUsersPaginated(Pageable pageable) {
        log.info("Getting paginated users with page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<User> usersPage = userRepository.findAll(pageable);
        Page<UserResponse> userResponsePage = usersPage.map(userMapper::toUserResponse);
        log.info("Retrieved {} users out of {} total", userResponsePage.getNumberOfElements(), userResponsePage.getTotalElements());
        return userResponsePage;
    }

    @PostAuthorize("returnObject.username == authentication.name")
    public UserResponse getUserByUsername(String username) {
        log.info("Getting user by username: {}", username);
        return userMapper.toUserResponse(userRepository.findByUsername(username).orElseThrow(() -> {
            log.warn("User not found: {}", username);
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        }));
    }

    @PostAuthorize("returnObject.username == authentication.name")
    public User updateUser(UserRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> new RuntimeException("User not found"));
        if (request.getPassword() == null && request.getEmail() == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }
        userMapper.updateUser(user, request);
        user.setPassword(new BCryptPasswordEncoder(10).encode(request.getPassword()));

        var roles = roleRepository.findAllById(request.getRoles());
        user.setRoles(new HashSet<>(roles));

        return userRepository.save(user);
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public void deleteUser(UserRequest request) {
        log.info("Admin attempting to delete user: {}", request.getUsername());
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> {
            log.warn("Delete failed: User not found - {}", request.getUsername());
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        });

        userRepository.delete(user);
        log.info("User deleted successfully: {}", request.getUsername());
    }

    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        if (context.getAuthentication() == null || context.getAuthentication().getName() == null) {
            log.warn("User info request failed: No authentication found");
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String name = context.getAuthentication().getName();
        log.info("User requesting their own information: {}", name);

        User user = userRepository.findByUsername(name).orElseThrow(() -> {
            log.warn("User info request failed: User not found in database - {}", name);
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        });

        return userMapper.toUserResponse(user);
    }
}
