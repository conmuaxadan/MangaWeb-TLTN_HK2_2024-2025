package com.raindrop.identity_service.service;

import com.raindrop.common.event.UserEvent;
import com.raindrop.identity_service.dto.request.ChangeDisplayNameRequest;
import com.raindrop.identity_service.dto.request.ChangePasswordRequest;
import com.raindrop.identity_service.dto.request.LinkLocalAccountRequest;
import com.raindrop.identity_service.dto.request.ToggleUserStatusRequest;
import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.LinkedAccountResponse;
import com.raindrop.identity_service.dto.response.UserCommentResponse;
import com.raindrop.identity_service.dto.response.UserResponse;
import com.raindrop.identity_service.dto.response.UserStatisticsResponse;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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

        // Xử lý displayName
        String displayName = request.getDisplayName() != null ? request.getDisplayName() : request.getUsername();

        // Validate displayName length
        if (displayName.trim().isEmpty()) {
            log.warn("User creation failed: Display name is empty for username: {}", request.getUsername());
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        if (displayName.length() < 6) {
            log.warn("User creation failed: Display name too short for username: {}", request.getUsername());
            throw new AppException(ErrorCode.DISPLAYNAME_TOO_SHORT);
        }

        if (displayName.length() > 16) {
            log.warn("User creation failed: Display name too long for username: {}", request.getUsername());
            throw new AppException(ErrorCode.DISPLAYNAME_TOO_LONG);
        }

        // Kiểm tra displayName đã tồn tại chưa
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
            String newDisplayName = request.getDisplayName();

            // Validate displayName length
            if (newDisplayName.trim().isEmpty()) {
                log.warn("Update failed: Display name is empty for user: {}", request.getUsername());
                throw new AppException(ErrorCode.VALIDATION_ERROR);
            }

            if (newDisplayName.length() < 6) {
                log.warn("Update failed: Display name too short for user: {}", request.getUsername());
                throw new AppException(ErrorCode.DISPLAYNAME_TOO_SHORT);
            }

            if (newDisplayName.length() > 16) {
                log.warn("Update failed: Display name too long for user: {}", request.getUsername());
                throw new AppException(ErrorCode.DISPLAYNAME_TOO_LONG);
            }

            // Kiểm tra nếu displayName mới khác với displayName hiện tại
            if (!newDisplayName.equals(user.getDisplayName())) {
                // Kiểm tra xem displayName mới đã tồn tại chưa
                if (userRepository.existsByDisplayName(newDisplayName)) {
                    log.warn("Update failed: Display name already exists - {}", newDisplayName);
                    throw new AppException(ErrorCode.DISPLAYNAME_EXISTED);
                }

                log.debug("Updating display name for user: {} to {}", request.getUsername(), newDisplayName);
                user.setDisplayName(newDisplayName);
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
                .enabled(user.isEnabled()) // Thêm trạng thái tài khoản
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
     * Thay đổi trạng thái tài khoản (khóa/mở khóa)
     * @param request Yêu cầu thay đổi trạng thái
     * @return Thông tin người dùng đã cập nhật
     */
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional
    public UserResponse toggleUserStatus(ToggleUserStatusRequest request) {
        log.info("Admin attempting to {} user with ID: {}", request.isEnabled() ? "enable" : "disable", request.getUserId());
        User user = userRepository.findById(request.getUserId()).orElseThrow(() -> {
            log.warn("Toggle status failed: User not found with ID - {}", request.getUserId());
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        });

        // Cập nhật trạng thái
        user.setEnabled(request.isEnabled());
        user = userRepository.save(user);

        log.info("User status updated successfully: {} is now {}", user.getUsername(), request.isEnabled() ? "enabled" : "disabled");
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

    public void updateDisplayName(String userId, ChangeDisplayNameRequest request) {
        log.info("Updating display name for user ID: {}", userId);

        // Validate displayName length
        String newDisplayName = request.getDisplayName();
        if (newDisplayName == null || newDisplayName.trim().isEmpty()) {
            log.warn("Display name update failed: Display name is empty for user ID: {}", userId);
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        if (newDisplayName.length() < 6) {
            log.warn("Display name update failed: Display name too short for user ID: {}", userId);
            throw new AppException(ErrorCode.DISPLAYNAME_TOO_SHORT);
        }

        if (newDisplayName.length() > 16) {
            log.warn("Display name update failed: Display name too long for user ID: {}", userId);
            throw new AppException(ErrorCode.DISPLAYNAME_TOO_LONG);
        }

        User user = userRepository.findById(userId).orElseThrow(() -> {
            log.warn("Display name update failed: User not found - ID: {}", userId);
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        });

        // Kiểm tra nếu displayName mới khác với displayName hiện tại
        if (!newDisplayName.equals(user.getDisplayName())) {
            // Kiểm tra xem displayName mới đã tồn tại chưa
            if (userRepository.existsByDisplayName(newDisplayName)) {
                log.warn("Display name update failed: Display name already exists - {}", newDisplayName);
                throw new AppException(ErrorCode.DISPLAYNAME_EXISTED);
            }

            user.setDisplayName(newDisplayName);
            userRepository.save(user);
            log.info("Display name updated successfully for user ID: {}", userId);
        } else {
            log.info("No changes to display name for user ID: {}", userId);
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
        // L���y user hiện tại
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

    /**
     * Lấy thống kê tổng hợp về người dùng
     * @return Thống kê tổng hợp về người dùng
     */
    public UserStatisticsResponse getUserStatistics() {
        log.info("Getting user statistics");

        // Lấy thời điểm bắt đầu của ngày, tuần, tháng hiện tại
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime startOfWeek = today.minusDays(today.getDayOfWeek().getValue() - 1).atStartOfDay();
        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();

        // Lấy thời điểm bắt đầu và kết thúc cho 7 ngày gần nhất
        LocalDateTime startDate = today.minusDays(6).atStartOfDay();
        LocalDateTime endDate = today.atTime(LocalTime.MAX);

        // Đếm tổng số người dùng và người dùng mới
        Long totalUsers = userRepository.count();
        Long newUsersToday = userRepository.countNewUsersToday(startOfDay);
        Long newUsersThisWeek = userRepository.countNewUsersThisWeek(startOfWeek);
        Long newUsersThisMonth = userRepository.countNewUsersThisMonth(startOfMonth);

        // Đếm số người dùng theo phương thức đăng nhập
        Map<String, Long> usersByAuthProvider = userRepository.countUsersByAuthProvider().stream()
                .collect(Collectors.toMap(
                        row -> row[0].toString(),
                        row -> ((Number) row[1]).longValue()
                ));

        // Tạo map cho 7 ngày gần nhất, giá trị mặc định là 0
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        Map<String, Long> usersByDay = Stream.iterate(0, i -> i <= 6, i -> i + 1)
                .map(i -> today.minusDays(6 - i))
                .collect(Collectors.toMap(
                        date -> date.format(formatter),
                        date -> 0L
                ));

        // Cập nhật số lượng người dùng mới theo ngày
        userRepository.countNewUsersByDay(startDate, endDate)
                .forEach(row -> usersByDay.put(row[0].toString(), ((Number) row[1]).longValue()));

        // Tạo response
        return UserStatisticsResponse.builder()
                .totalUsers(totalUsers)
                .newUsersToday(newUsersToday)
                .newUsersThisWeek(newUsersThisWeek)
                .newUsersThisMonth(newUsersThisMonth)
                .usersByAuthProvider(usersByAuthProvider)
                .usersByDay(usersByDay)
                .build();
    }

    /**
     * Tìm kiếm và lọc người dùng theo nhiều tiêu chí
     *
     * @param keyword Từ khóa tìm kiếm (tên đăng nhập, email hoặc tên hiển thị)
     * @param roleId ID của vai trò cần lọc (null nếu không lọc theo vai trò)
     * @param provider Nhà cung cấp xác thực cần lọc (null nếu không lọc theo nhà cung cấp)
     * @param enabled Trạng thái tài khoản cần lọc (null nếu không lọc theo trạng thái)
     * @param pageable Thông tin phân trang
     * @return Danh sách người dùng phân trang đã được lọc
     */
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Page<UserResponse> searchAndFilterUsers(
            String keyword,
            Integer roleId,
            String provider,
            Boolean enabled,
            Pageable pageable) {

        log.info("Searching and filtering users with criteria - keyword: {}, roleId: {}, provider: {}, enabled: {}",
                keyword, roleId, provider, enabled);

        // Xử lý trường hợp chuỗi tìm kiếm rỗng
        keyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        // Convert String provider to AuthProvider enum
        AuthProvider authProvider = null;
        if (provider != null && !provider.trim().isEmpty()) {
            try {
                authProvider = AuthProvider.valueOf(provider.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid provider value: {}", provider);
                // Nếu provider không hợp lệ, set về null để không lọc theo provider
                authProvider = null;
            }
        }

        Page<User> users = userRepository.searchAndFilterUsers(keyword, roleId, authProvider, enabled, pageable);
        Page<UserResponse> userResponsePage = users.map(userMapper::toUserResponse);

        log.info("Found {} users matching the criteria", userResponsePage.getTotalElements());
        return userResponsePage;
    }
}
