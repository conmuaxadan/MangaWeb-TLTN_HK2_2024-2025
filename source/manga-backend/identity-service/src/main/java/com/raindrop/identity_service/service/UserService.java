package com.raindrop.identity_service.service;

import com.raindrop.common.event.UserProfileEvent;
import com.raindrop.identity_service.dto.request.ChangePasswordRequest;
import com.raindrop.identity_service.dto.request.GoogleLinkRequest;
import com.raindrop.identity_service.dto.request.LinkLocalAccountRequest;
import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.LinkedAccountResponse;
import com.raindrop.identity_service.dto.response.UserResponse;
import com.raindrop.identity_service.entity.LinkedAccount;
import com.raindrop.identity_service.entity.Role;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.enums.AuthProvider;
import com.raindrop.identity_service.exception.AppException;
import com.raindrop.identity_service.enums.ErrorCode;
import com.raindrop.identity_service.mapper.ProfileMapper;
import com.raindrop.identity_service.mapper.UserMapper;
import com.raindrop.identity_service.repository.LinkedAccountRepository;
import com.raindrop.identity_service.repository.RoleRepository;
import com.raindrop.identity_service.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import com.raindrop.identity_service.kafka.UserProfileEventProducer;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
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
    ProfileMapper profileMapper;
    UserProfileEventProducer userProfileEventProducer;
    LinkedAccountRepository linkedAccountRepository;
    GoogleAuthService googleAuthService;


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
        user.setAuthProvider(AuthProvider.LOCAL);

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
                .avatarUrl("default.jpg")
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

    /**
     * Xóa người dùng theo username
     * @param username Username của người dùng cần xóa
     */
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public void deleteUserByUsername(String username) {
        log.info("Admin attempting to delete user: {}", username);
        User user = userRepository.findByUsername(username).orElseThrow(() -> {
            log.warn("Delete failed: User not found - {}", username);
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        });

        userRepository.delete(user);
        log.info("User deleted successfully: {}", username);
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

    /**
     * Đổi mật khẩu của người dùng hiện tại
     * @param request Yêu cầu đổi mật khẩu
     */
    public void changePassword(ChangePasswordRequest request) {
        // Lấy thông tin người dùng hiện tại
        var context = SecurityContextHolder.getContext();
        if (context.getAuthentication() == null) {
            log.warn("Change password request failed: No authentication found");
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Lấy ID của user từ token JWT
        String userId = null;
        if (context.getAuthentication() instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            Jwt jwt = jwtAuthenticationToken.getToken();
            userId = jwt.getSubject(); // Subject trong JWT là ID của user
        }

        if (userId == null) {
            log.warn("Change password request failed: Could not extract user ID from token");
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        log.info("User requesting password change, ID: {}", userId);

        User user = userRepository.findById(userId).orElseThrow(() -> {
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        });

        // Kiểm tra mật khẩu cũ
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            log.warn("Change password request failed: Incorrect old password for user ID: {}", userId);
            throw new AppException(ErrorCode.INCORRECT_PASSWORD);
        }

        // Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed successfully for user ID: {}", userId);
    }

    /**
     * Lấy thông tin người dùng hiện tại từ SecurityContext
     * @return Đối tượng User hiện tại
     */
    private User getCurrentAuthenticatedUser() {
        var context = SecurityContextHolder.getContext();
        if (context.getAuthentication() == null) {
            log.warn("No authentication found");
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Lấy ID của user từ token JWT
        String userId = null;
        if (context.getAuthentication() instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            Jwt jwt = jwtAuthenticationToken.getToken();
            userId = jwt.getSubject(); // Subject trong JWT là ID của user
        }

        if (userId == null) {
            log.warn("Could not extract user ID from token");
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return userRepository.findById(userId).orElseThrow(() -> {
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        });
    }

    /**
     * Liên kết tài khoản hiện tại với tài khoản Google
     * @param code Mã xác thực từ Google
     * @param redirectUri URI chuyển hướng
     */
    @Transactional
    public void linkGoogleAccount(String code, String redirectUri) {
        // Lấy user hiện tại
        User currentUser = getCurrentAuthenticatedUser();

        // Lấy thông tin từ Google
        var googleUserInfo = googleAuthService.getGoogleUserInfo(code, redirectUri);

        // Kiểm tra xem Google ID này đã được liên kết với tài khoản khác chưa
        Optional<LinkedAccount> existingLink = linkedAccountRepository.findByProviderAndProviderUserId(
            AuthProvider.GOOGLE, googleUserInfo.getGoogleId());

        if (existingLink.isPresent()) {
            // Nếu đã liên kết với tài khoản khác
            if (!existingLink.get().getUser().getId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.ACCOUNT_ALREADY_LINKED);
            }
            // Nếu đã liên kết với tài khoản hiện tại, không làm gì
            return;
        }

        // Tạo liên kết mới sử dụng Builder
        LinkedAccount linkedAccount = LinkedAccount.builder()
            .user(currentUser)
            .provider(AuthProvider.GOOGLE)
            .email(googleUserInfo.getEmail())
            .providerUserId(googleUserInfo.getGoogleId())
            .build();

        linkedAccountRepository.save(linkedAccount);

        log.info("Linked Google account {} to user {}", googleUserInfo.getEmail(), currentUser.getUsername());
    }

    /**
     * Liên kết tài khoản hiện tại với tài khoản Local mới
     * @param request Thông tin tài khoản local mới
     */
    @Transactional
    public void linkLocalAccount(LinkLocalAccountRequest request) {
        // Lấy user hiện tại
        User currentUser = getCurrentAuthenticatedUser();

        // Kiểm tra xem username và email đã tồn tại chưa
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        // Kiểm tra trong LinkedAccount
        if (linkedAccountRepository.existsByProviderAndUsername(AuthProvider.LOCAL, request.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        if (linkedAccountRepository.existsByProviderAndEmail(AuthProvider.LOCAL, request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        // Tạo liên kết mới sử dụng Builder
        LinkedAccount linkedAccount = LinkedAccount.builder()
            .user(currentUser)
            .provider(AuthProvider.LOCAL)
            .username(request.getUsername())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .build();

        linkedAccountRepository.save(linkedAccount);

        log.info("Linked Local account {} to user {}", request.getUsername(), currentUser.getUsername());
    }

    /**
     * Lấy danh sách tài khoản đã liên kết của người dùng hiện tại
     * @return Danh sách tài khoản đã liên kết
     */
    public List<LinkedAccountResponse> getLinkedAccounts() {
        User currentUser = getCurrentAuthenticatedUser();
        List<LinkedAccount> linkedAccounts = linkedAccountRepository.findAllByUser(currentUser);

        return linkedAccounts.stream()
            .map(account -> LinkedAccountResponse.builder()
                .id(account.getId())
                .provider(account.getProvider())
                .username(account.getUsername())
                .email(account.getEmail())
                .providerUserId(account.getProviderUserId())
                .linkedAt(account.getLinkedAt())
                .build())
            .collect(Collectors.toList());
    }

    /**
     * Hủy liên kết tài khoản
     * @param linkedAccountId ID của tài khoản liên kết cần hủy
     */
    @Transactional
    public void unlinkAccount(String linkedAccountId) {
        User currentUser = getCurrentAuthenticatedUser();

        LinkedAccount linkedAccount = linkedAccountRepository.findById(linkedAccountId)
            .orElseThrow(() -> new AppException(ErrorCode.LINKED_ACCOUNT_NOT_FOUND));

        // Kiểm tra xem linkedAccount có thuộc về user hiện tại không
        if (!linkedAccount.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Không cần kiểm tra số lượng tài khoản liên kết
        // Vì việc xóa tài khoản liên kết không ảnh hưởng đến tài khoản chính
        // List<LinkedAccount> userAccounts = linkedAccountRepository.findAllByUser(currentUser);
        // if (userAccounts.size() <= 1) {
        //     throw new AppException(ErrorCode.CANNOT_UNLINK_LAST_ACCOUNT);
        // }

        linkedAccountRepository.delete(linkedAccount);
        log.info("Unlinked account {} from user {}", linkedAccountId, currentUser.getUsername());
    }
}
