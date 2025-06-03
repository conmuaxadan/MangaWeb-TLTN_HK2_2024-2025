package com.raindrop.identity_service.service;

import com.raindrop.common.event.UserEvent;
import com.raindrop.identity_service.dto.request.*;
import com.raindrop.identity_service.dto.response.*;
import com.raindrop.identity_service.entity.LinkedAccount;
import com.raindrop.identity_service.entity.Role;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.enums.AuthProvider;
import com.raindrop.identity_service.exception.AppException;
import com.raindrop.identity_service.enums.ErrorCode;
import com.raindrop.identity_service.kafka.UserBlockEventProducer;
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
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;
    LinkedAccountRepository linkedAccountRepository;
    GoogleAuthService googleAuthService;
    UploadClient uploadClient;

    UserEventProducer userEventProducer;
    UserBlockEventProducer userBlockEventProducer;


    public UserResponse createUser(UserRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        // Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        // Xử lý displayName
        String displayName = request.getDisplayName() != null ? request.getDisplayName() : request.getUsername();

        // Validate displayName length
        if (displayName.trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        if (displayName.length() < 6) {
            throw new AppException(ErrorCode.DISPLAYNAME_TOO_SHORT);
        }

        if (displayName.length() > 16) {
            throw new AppException(ErrorCode.DISPLAYNAME_TOO_LONG);
        }

        // Kiểm tra displayName đã tồn tại chưa
        if (userRepository.existsByDisplayName(displayName)) {
            throw new AppException(ErrorCode.DISPLAYNAME_EXISTED);
        }

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        var roles = new HashSet<Role>();
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            roles.addAll(roleRepository.findAllById(request.getRoles()));
        } else {
            roles.add(roleRepository.findByName("USER"));
        }
        user.setRoles(roles);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setDisplayName(request.getDisplayName() != null ? request.getDisplayName() : request.getUsername());
        user.setAvatarUrl(request.getAvatarUrl()!= null ? request.getAvatarUrl() : "default.jpg");

        user = userRepository.save(user);
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
        List<UserResponse> users = userRepository.findAll().stream().map(userMapper::toUserResponse).collect(Collectors.toList());
        return users;
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Page<UserResponse> getAllUsersPaginated(Pageable pageable) {
        Page<User> usersPage = userRepository.findAll(pageable);
        Page<UserResponse> userResponsePage = usersPage.map(userMapper::toUserResponse);
        return userResponsePage;
    }

    @PostAuthorize("returnObject.username == authentication.name")
    public UserResponse getUserByUsername(String username) {
        return userMapper.toUserResponse(userRepository.findByUsername(username).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    public User updateUser(UserRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_EXISTED));

        // Lưu trữ email hiện tại để đảm bảo không bị thay đổi
        String currentEmail = user.getEmail();

        // Cập nhật thông tin cơ bản (trừ username và email)
        userMapper.updateUser(user, request);

        // Khôi phục email ban đầu
        user.setEmail(currentEmail);

        // Cập nhật mật khẩu nếu có
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Cập nhật displayName nếu có
        if (request.getDisplayName() != null) {
            String newDisplayName = request.getDisplayName();

            // Validate displayName length
            if (newDisplayName.trim().isEmpty()) {
                throw new AppException(ErrorCode.VALIDATION_ERROR);
            }

            if (newDisplayName.length() < 6) {
                throw new AppException(ErrorCode.DISPLAYNAME_TOO_SHORT);
            }

            if (newDisplayName.length() > 16) {
                throw new AppException(ErrorCode.DISPLAYNAME_TOO_LONG);
            }

            // Kiểm tra nếu displayName mới khác với displayName hiện tại
            if (!newDisplayName.equals(user.getDisplayName())) {
                // Kiểm tra xem displayName mới đã tồn tại chưa
                if (userRepository.existsByDisplayName(newDisplayName)) {
                    throw new AppException(ErrorCode.DISPLAYNAME_EXISTED);
                }

                user.setDisplayName(newDisplayName);
            }
        }

        // Cập nhật avatarUrl nếu có
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        // Cập nhật roles nếu có
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            var roles = roleRepository.findAllById(request.getRoles());
            user.setRoles(new HashSet<>(roles));
        }

        user = userRepository.save(user);

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

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public void deleteUserByUsername(String username) {
        User user = userRepository.findByUsername(username).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_EXISTED));

        userRepository.delete(user);
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional
    public UserResponse toggleUserStatus(ToggleUserStatusRequest request) {
        User user = userRepository.findById(request.getUserId()).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_EXISTED));

        // Cập nhật trạng thái
        user.setEnabled(request.isEnabled());
        user = userRepository.save(user);

        if (!request.isEnabled()) {
            userBlockEventProducer.sendBlockUserEvent(user.getEmail(), user.getDisplayName(), request.getReason());
        } else {
            userBlockEventProducer.sendUnblockUserEvent(user.getEmail(), user.getDisplayName(), request.getReason());
        }
        return userMapper.toUserResponse(user);
    }

    public void changePassword(ChangePasswordRequest request) {
        // Lấy thông tin người dùng hiện tại
        var context = SecurityContextHolder.getContext();
        if (context.getAuthentication() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Lấy ID của user từ token JWT
        String userId = null;
        if (context.getAuthentication() instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            Jwt jwt = jwtAuthenticationToken.getToken();
            userId = jwt.getSubject(); // Subject trong JWT là ID của user
        }

        if (userId == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        User user = userRepository.findById(userId).orElseThrow(() -> {
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        });

        // Kiểm tra mật khẩu cũ
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INCORRECT_PASSWORD);
        }

        // Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public void updateDisplayName(String userId, ChangeDisplayNameRequest request) {
        // Validate displayName length
        String newDisplayName = request.getDisplayName();
        if (newDisplayName == null || newDisplayName.trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        if (newDisplayName.length() < 6) {
            throw new AppException(ErrorCode.DISPLAYNAME_TOO_SHORT);
        }

        if (newDisplayName.length() > 16) {
            throw new AppException(ErrorCode.DISPLAYNAME_TOO_LONG);
        }

        User user = userRepository.findById(userId).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_EXISTED));

        // Kiểm tra nếu displayName mới khác với displayName hiện tại
        if (!newDisplayName.equals(user.getDisplayName())) {
            // Kiểm tra xem displayName mới đã tồn tại chưa
            if (userRepository.existsByDisplayName(newDisplayName)) {
                throw new AppException(ErrorCode.DISPLAYNAME_EXISTED);
            }

            user.setDisplayName(newDisplayName);
            userRepository.save(user);
        }
    }

    private User getCurrentAuthenticatedUser() {
        var context = SecurityContextHolder.getContext();
        if (context.getAuthentication() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Lấy ID của user từ token JWT
        String userId = null;
        if (context.getAuthentication() instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            Jwt jwt = jwtAuthenticationToken.getToken();
            userId = jwt.getSubject(); // Subject trong JWT là ID của user
        }

        if (userId == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return userRepository.findById(userId).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_EXISTED));
    }

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
    }

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
    }

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
    }

    @Transactional
    public UserResponse updateAvatar(String userId, MultipartFile file) {
        // Kiểm tra file
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        // Kiểm tra loại file
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        User user = userRepository.findById(userId).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_EXISTED));

        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                throw new AppException(ErrorCode.SERVER_ERROR);
            }

            var header = attributes.getRequest().getHeader("Authorization");
            if (header == null || header.isEmpty()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            // Xóa ảnh cũ nếu có và không phải ảnh mặc định
            String oldAvatarUrl = user.getAvatarUrl();
            if (oldAvatarUrl != null && !oldAvatarUrl.isEmpty() && !oldAvatarUrl.contains("i.pinimg.com")) {
                try {
                    // Lấy tên file từ URL
                    String fileName = oldAvatarUrl.substring(oldAvatarUrl.lastIndexOf("/") + 1);
                    uploadClient.deleteFile(header, fileName);
                } catch (Exception e) {
                    // Tiếp tục xử lý ngay cả khi xóa ảnh cũ thất bại
                }
            }

            // Upload ảnh mới
            var uploadResponse = uploadClient.uploadAvatar(header, file);
            if (uploadResponse.getCode() != 201 || uploadResponse.getResult() == null) {
                throw new AppException(ErrorCode.FILE_UPLOAD_ERROR);
            }

            String newAvatarUrl = uploadResponse.getResult().getFileName();
            user.setAvatarUrl(newAvatarUrl);

            user = userRepository.save(user);

            return userMapper.toUserResponse(user);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.SERVER_ERROR);
        }
    }

    @Transactional
    public UserResponse deleteAvatar(String userId) {
        User user = userRepository.findById(userId).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_EXISTED));

        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                throw new AppException(ErrorCode.SERVER_ERROR);
            }

            var header = attributes.getRequest().getHeader("Authorization");
            if (header == null || header.isEmpty()) {
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
                } catch (Exception e) {
                    // Tiếp tục xử lý ngay cả khi xóa ảnh cũ thất bại
                }
            }

            // Đặt lại avatar mặc định
            user.setAvatarUrl("default.jpg");
            user = userRepository.save(user);

            return userMapper.toUserResponse(user);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.SERVER_ERROR);
        }
    }

    public UserStatisticsResponse getUserStatistics() {

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

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Page<UserResponse> searchAndFilterUsers(
            String keyword,
            Integer roleId,
            String provider,
            Boolean enabled,
            Pageable pageable) {

        // Xử lý trường hợp chuỗi tìm kiếm rỗng
        keyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        // Convert String provider to AuthProvider enum
        AuthProvider authProvider = null;
        if (provider != null && !provider.trim().isEmpty()) {
            try {
                authProvider = AuthProvider.valueOf(provider.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Nếu provider không hợp lệ, set về null để không lọc theo provider
                authProvider = null;
            }
        }

        Page<User> users = userRepository.searchAndFilterUsers(keyword, roleId, authProvider, enabled, pageable);
        Page<UserResponse> userResponsePage = users.map(userMapper::toUserResponse);

        return userResponsePage;
    }

    public UserEmailResponse getUserInfoById(UserEmailRequest request) {
        List<UserInfoResponse> userInfoResponses = new ArrayList<>();
        for (String id : request.getIds()) {
            User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
            userInfoResponses.add(UserInfoResponse.builder()
                    .displayName(user.getDisplayName())
                    .email(user.getEmail())
                    .build());
        }
        return UserEmailResponse.builder()
                .userInfoResponses(userInfoResponses)
                .build();
    }
}
