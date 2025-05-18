package com.raindrop.identity_service.service;

import com.raindrop.common.event.UserEvent;
import com.raindrop.identity_service.dto.request.ChangeDisplayNameRequest;
import com.raindrop.identity_service.dto.request.ChangePasswordRequest;
import com.raindrop.identity_service.dto.request.LinkLocalAccountRequest;
import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.LinkedAccountResponse;
import com.raindrop.identity_service.dto.response.UserCommentResponse;
import com.raindrop.identity_service.dto.response.UserResponse;
import com.raindrop.identity_service.entity.LinkedAccount;
import com.raindrop.identity_service.entity.Role;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.enums.AuthProvider;
import com.raindrop.identity_service.exception.AppException;
import com.raindrop.identity_service.enums.ErrorCode;
import com.raindrop.identity_service.kafka.UserEventProducer;
import com.raindrop.identity_service.mapper.UserMapper;
import com.raindrop.identity_service.repository.LinkedAccountRepository;
import com.raindrop.identity_service.repository.RoleRepository;
import com.raindrop.identity_service.repository.UserRepository;
import com.raindrop.identity_service.repository.httpclient.UploadClient;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
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
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

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
    LinkedAccountRepository linkedAccountRepository;
    GoogleAuthService googleAuthService;
    UploadClient uploadClient;

    UserEventProducer userEventProducer;


    public UserResponse createUser(UserRequest request) {
        log.info("Creating new user: {}", request.getUsername());

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            log.warn("User creation failed: Username already exists - {}", request.getUsername());
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        // Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("User creation failed: Email already exists - {}", request.getEmail());
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        // Kiểm tra displayName đã tồn tại chưa (nếu có)
        String displayName = request.getDisplayName() != null ? request.getDisplayName() : request.getUsername();
        if (userRepository.existsByDisplayName(displayName)) {
            log.warn("User creation failed: Display name already exists - {}", displayName);
            throw new AppException(ErrorCode.DISPLAYNAME_EXISTED);
        }

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Assign default role - tìm kiếm role USER đã tồn tại trong cơ sở dữ liệu
        var roles = new HashSet<Role>();
        Role userRole = roleRepository.findByName("USER");
        if (userRole == null) {
            log.error("Default USER role not found in database");
            throw new AppException(ErrorCode.ROLE_NOT_FOUND);
        }
        roles.add(userRole);
        user.setRoles(roles);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setDisplayName(request.getDisplayName() != null ? request.getDisplayName() : request.getUsername());
        user.setAvatarUrl("default.jpg");

        log.debug("Saving user to database: {}", request.getUsername());
        user = userRepository.save(user);
        log.info("User saved successfully with ID: {}", user.getId());
        UserEvent userEvent = UserEvent.builder()
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .build();

        userEventProducer.sendNewUserEvent(userEvent);
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

    public User updateUser(UserRequest request) {
        log.info("Updating user: {}", request.getUsername());
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> {
            log.warn("Update failed: User not found - {}", request.getUsername());
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        });

        // Lưu trữ email hiện tại để đảm bảo không bị thay đổi
        String currentEmail = user.getEmail();

        // Cập nhật thông tin cơ bản (trừ username và email)
        userMapper.updateUser(user, request);

        // Khôi phục email ban đầu
        user.setEmail(currentEmail);

        // Cập nhật mật khẩu nếu có
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            log.debug("Updating password for user: {}", request.getUsername());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Cập nhật displayName nếu có
        if (request.getDisplayName() != null) {
            // Kiểm tra nếu displayName mới khác với displayName hiện tại
            if (!request.getDisplayName().equals(user.getDisplayName())) {
                // Kiểm tra xem displayName mới đã tồn tại chưa
                if (userRepository.existsByDisplayName(request.getDisplayName())) {
                    log.warn("Update failed: Display name already exists - {}", request.getDisplayName());
                    throw new AppException(ErrorCode.DISPLAYNAME_EXISTED);
                }

                log.debug("Updating display name for user: {} to {}", request.getUsername(), request.getDisplayName());
                user.setDisplayName(request.getDisplayName());
            }
        }

        // Cập nhật avatarUrl nếu có
        if (request.getAvatarUrl() != null) {
            log.debug("Updating avatar URL for user: {} to {}", request.getUsername(), request.getAvatarUrl());
            user.setAvatarUrl(request.getAvatarUrl());
        }

        // Cập nhật roles nếu có
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            log.debug("Updating roles for user: {}", request.getUsername());
            var roles = roleRepository.findAllById(request.getRoles());
            user.setRoles(new HashSet<>(roles));
        }

        // Ghi log nếu có yêu cầu cập nhật email
        if (request.getEmail() != null && !request.getEmail().equals(currentEmail)) {
            log.warn("Attempted to update email for user: {} from {} to {}, but email updates are not allowed",
                    request.getUsername(), currentEmail, request.getEmail());
        }

        user = userRepository.save(user);
        log.info("User updated successfully: {}", request.getUsername());

        return user;
    }

    public UserResponse getUserById(String id) {
        return userMapper.toUserResponse(userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found")));
    }

    public UserCommentResponse getUserCommentById(String userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        return UserCommentResponse.builder()
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .build();
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

    public void updateDisplayName(String userId, ChangeDisplayNameRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_EXISTED));
        // Kiểm tra nếu displayName mới khác với displayName hiện tại
        if (!request.getDisplayName().equals(user.getDisplayName())) {
            // Kiểm tra xem displayName mới đã tồn tại chưa
            if (userRepository.existsByDisplayName(request.getDisplayName())) {
                throw new AppException(ErrorCode.DISPLAYNAME_EXISTED);
            }

            user.setDisplayName(request.getDisplayName());
            userRepository.save(user);
        }
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
        linkedAccountRepository.delete(linkedAccount);
        log.info("Unlinked account {} from user {}", linkedAccountId, currentUser.getUsername());
    }


    /**
     * Cập nhật ảnh đại diện của người dùng
     * @param userId ID của người dùng
     * @param file File ảnh đại diện mới
     * @return Thông tin người dùng đã cập nhật
     */
    @Transactional
    public UserResponse updateAvatar(String userId, MultipartFile file) {
        log.info("Updating avatar for user ID: {}", userId);

        // Kiểm tra file
        if (file == null || file.isEmpty()) {
            log.warn("Avatar update failed: Empty file for user ID: {}", userId);
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        // Kiểm tra loại file
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            log.warn("Avatar update failed: Invalid file type for user ID: {}", userId);
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        User user = userRepository.findById(userId).orElseThrow(() -> {
            log.warn("Avatar update failed: User not found - ID: {}", userId);
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        });

        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                log.error("Cannot access request attributes");
                throw new AppException(ErrorCode.SERVER_ERROR);
            }

            var header = attributes.getRequest().getHeader("Authorization");
            if (header == null || header.isEmpty()) {
                log.warn("Authorization header is missing");
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            // Xóa ảnh cũ nếu có và không phải ảnh mặc định
            String oldAvatarUrl = user.getAvatarUrl();
            if (oldAvatarUrl != null && !oldAvatarUrl.isEmpty() && !oldAvatarUrl.contains("i.pinimg.com")) {
                try {
                    // Lấy tên file từ URL
                    String fileName = oldAvatarUrl.substring(oldAvatarUrl.lastIndexOf("/") + 1);
                    uploadClient.deleteFile(header, fileName);
                    log.info("Deleted old avatar: {}", fileName);
                } catch (Exception e) {
                    log.warn("Failed to delete old avatar: {}", oldAvatarUrl, e);
                    // Tiếp tục xử lý ngay cả khi xóa ảnh cũ thất bại
                }
            }

            // Upload ảnh mới
            var uploadResponse = uploadClient.uploadAvatar(header, file);
            if (uploadResponse.getCode() != 1000 || uploadResponse.getResult() == null) {
                log.error("Failed to upload avatar: {}", uploadResponse.getMessage());
                throw new AppException(ErrorCode.FILE_UPLOAD_ERROR);
            }

            String newAvatarUrl = uploadResponse.getResult().getFileName();
            user.setAvatarUrl(newAvatarUrl);
            log.info("Uploaded new avatar: {}", newAvatarUrl);

            user = userRepository.save(user);
            log.info("Avatar updated successfully for user ID: {}", userId);

            return userMapper.toUserResponse(user);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating avatar for user ID: {}", userId, e);
            throw new AppException(ErrorCode.SERVER_ERROR);
        }
    }

    /**
     * Xóa ảnh đại diện của người dùng
     * @param userId ID của người dùng
     * @return Thông tin người dùng đã cập nhật
     */
    @Transactional
    public UserResponse deleteAvatar(String userId) {
        log.info("Deleting avatar for user ID: {}", userId);

        User user = userRepository.findById(userId).orElseThrow(() -> {
            log.warn("Avatar deletion failed: User not found - ID: {}", userId);
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        });

        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                log.error("Cannot access request attributes");
                throw new AppException(ErrorCode.SERVER_ERROR);
            }

            var header = attributes.getRequest().getHeader("Authorization");
            if (header == null || header.isEmpty()) {
                log.warn("Authorization header is missing");
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            // Xóa ảnh cũ nếu có và không phải ảnh mặc định
            String oldAvatarUrl = user.getAvatarUrl();
            if (oldAvatarUrl != null && !oldAvatarUrl.isEmpty() &&
                !oldAvatarUrl.equals("default.jpg") &&
                !oldAvatarUrl.contains("i.pinimg.com")) {
                try {
                    // Lấy tên file từ URL
                    String fileName = oldAvatarUrl.substring(oldAvatarUrl.lastIndexOf("/") + 1);
                    uploadClient.deleteFile(header, fileName);
                    log.info("Deleted avatar: {}", fileName);
                } catch (Exception e) {
                    log.warn("Failed to delete avatar: {}", oldAvatarUrl, e);
                    // Tiếp tục xử lý ngay cả khi xóa ảnh cũ thất bại
                }
            }

            // Đặt lại avatar mặc định
            user.setAvatarUrl("default.jpg");
            user = userRepository.save(user);
            log.info("Avatar reset to default for user ID: {}", userId);

            return userMapper.toUserResponse(user);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting avatar for user ID: {}", userId, e);
            throw new AppException(ErrorCode.SERVER_ERROR);
        }
    }
}
