package com.raindrop.identity_service.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.raindrop.identity_service.dto.request.*;
import com.raindrop.identity_service.dto.response.AuthenticationResponse;
import com.raindrop.identity_service.dto.response.ForgotPasswordResponse;
import com.raindrop.identity_service.dto.response.IntrospectResponse;
import com.raindrop.identity_service.kafka.PasswordResetEventProducer;
import com.raindrop.identity_service.entity.LinkedAccount;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.enums.AuthProvider;
import com.raindrop.identity_service.exception.AppException;
import com.raindrop.identity_service.enums.ErrorCode;
import com.raindrop.identity_service.repository.LinkedAccountRepository;
import com.raindrop.identity_service.repository.UserRepository;
import com.raindrop.identity_service.service.TokenRedisService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.client.RestClient;

import java.text.ParseException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = lombok.AccessLevel.PRIVATE)
public class AuthenticationService {
    UserRepository userRepository;
    LinkedAccountRepository linkedAccountRepository;
    TokenRedisService tokenRedisService;
    RedisTemplate<String, Object> redisTemplate;
    PasswordEncoder passwordEncoder;
    PasswordResetEventProducer passwordResetEventProducer;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    // Thời gian sống của access token (1 giờ)
    private static final long ACCESS_TOKEN_EXPIRATION = 60 * 60; // 1 giờ tính bằng giây

    // Thời gian sống của refresh token (7 ngày)
    private static final long REFRESH_TOKEN_EXPIRATION = 7 * 24 * 60 * 60; // 7 ngày tính bằng giây

    // Prefix cho key trong Redis
    private static final String RESET_CODE_PREFIX = "password_reset_code:";
    // Thời gian hết hạn của mã xác nhận (60 giây)
    private static final long CODE_EXPIRY_SECONDS = 60;

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        var token = request.getToken();
        log.debug("Introspecting token");
        boolean valid;
        try {
            verifyToken(token);
            valid = true;
            log.debug("Token is valid");
        } catch (AppException e) {
            valid = false;
            log.debug("Token is invalid: {}", e.getMessage());
        }
        return IntrospectResponse.builder()
                .valid(valid)
                .build();
    }

    @Transactional
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        log.info("Authenticating user with input: {}", request.getUsername());

        String usernameOrEmail = request.getUsername();
        User user;

        // Tìm kiếm user theo username hoặc email
        var userByUsername = userRepository.findByUsername(usernameOrEmail);
        if (userByUsername.isPresent()) {
            user = userByUsername.get();

            // Kiểm tra mật khẩu
            PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
            boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

            if (!authenticated) {
                log.warn("Authentication failed: Invalid password for user {}", usernameOrEmail);
                throw new AppException(ErrorCode.INVALID_CREDENTIALS);
            }
        } else {
            var userByEmail = userRepository.findByEmail(usernameOrEmail);
            if (userByEmail.isPresent()) {
                user = userByEmail.get();

                // Kiểm tra mật khẩu
                PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
                boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

                if (!authenticated) {
                    log.warn("Authentication failed: Invalid password for user {}", usernameOrEmail);
                    throw new AppException(ErrorCode.INVALID_CREDENTIALS);
                }
            } else {
                // Tìm trong LinkedAccount
                user = findUserByLinkedAccount(usernameOrEmail, request.getPassword());
            }
        }

        log.info("User authenticated successfully: {}", user.getUsername());

        // Tạo access token và refresh token cho user chính
        var accessToken = generateToken(user);
        var refreshToken = createRefreshToken(user);

        return AuthenticationResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .authenticated(true)
                .expiresIn(ACCESS_TOKEN_EXPIRATION)
                .build();
    }

    @Transactional
    public AuthenticationResponse googleAuthenticate(GoogleAuthenticationRequest request) {
        log.info("Authenticating Google user: {}", request.getUsername());
        var user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> {
            log.warn("Google authentication failed: User not found - {}", request.getUsername());
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        });
        log.info("Google user authenticated successfully: {}", request.getUsername());
        // Tạo access token
        var accessToken = generateToken(user);
        // Tạo refresh token
        var refreshToken = createRefreshToken(user);

        return AuthenticationResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .authenticated(true)
                .expiresIn(ACCESS_TOKEN_EXPIRATION)
                .build();
    }



    @Transactional
    public void logout(LogoutRequest request) throws JOSEException, ParseException {
        log.info("Processing logout request");
        var signToken = verifyToken(request.getToken());

        String jit = signToken.getJWTClaimsSet().getJWTID();
        String subject = signToken.getJWTClaimsSet().getSubject();
        Date expirationTime = signToken.getJWTClaimsSet().getExpirationTime();

        log.info("Invalidating token for user: {}", subject);

        // Tính thời gian còn lại của token (tính bằng giây)
        long expirationTimeInSeconds = (expirationTime.getTime() - System.currentTimeMillis()) / 1000;
        if (expirationTimeInSeconds > 0) {
            // Thêm token vào blacklist trong Redis
            tokenRedisService.addToBlacklist(jit, expirationTimeInSeconds);
        }

        // Thu hồi tất cả refresh token của người dùng
        tokenRedisService.revokeAllUserRefreshTokens(subject);
        log.info("All refresh tokens revoked for user: {}", subject);

        log.info("User logged out successfully: {}", subject);
    }

    private SignedJWT verifyToken(String token) throws JOSEException, ParseException {
        log.debug("Verifying token");
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        String subject = signedJWT.getJWTClaimsSet().getSubject();
        String tokenId = signedJWT.getJWTClaimsSet().getJWTID();

        var verified = signedJWT.verify(verifier);
        if (!verified) {
            log.warn("Token verification failed: Invalid signature");
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        if (expirationTime.before(new Date())) {
            log.warn("Token verification failed: Token expired for user {}", subject);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Kiểm tra token có trong blacklist của Redis không
        if (tokenRedisService.isBlacklisted(tokenId)) {
            log.warn("Token verification failed: Token has been blacklisted for user {}", subject);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        log.debug("Token verified successfully for user: {}", subject);
        return signedJWT;
    }

    private String generateToken(User user) {
        log.debug("Generating token for user: {}", user.getUsername());
        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);

        String tokenId = UUID.randomUUID().toString();
        Date issuedAt = new Date();
        Date expirationTime = new Date(Instant.now().plus(1, ChronoUnit.HOURS).toEpochMilli());

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getId())
                .issuer("raindrop.com")
                .issueTime(issuedAt)
                .expirationTime(expirationTime)
                .jwtID(tokenId)
                .claim("scope", buildScope(user))
                .claim("email", user.getEmail())
                .claim("username", user.getUsername())
                .claim("authProvider", user.getAuthProvider().name())
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(jwsHeader, payload);

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            log.info("Token generated successfully for user: {}, expires at: {}",
                    user.getUsername(), expirationTime);
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Error signing token for user: {}", user.getUsername(), e);
            throw new RuntimeException(e);
        }
    }

    private String buildScope(User user) {

        StringJoiner joiner = new StringJoiner(" ");
        if (!CollectionUtils.isEmpty(user.getRoles())) {
            user.getRoles().forEach(role -> {
                joiner.add("ROLE_" + role.getName());
                if (!CollectionUtils.isEmpty(role.getPermissions())) {
                    role.getPermissions().forEach(permission -> {
                        joiner.add(permission.getName());
                    });
                }
            });
        }

        return joiner.toString();
    }

    /**
     * Tạo mới refresh token cho người dùng
     * @param user Người dùng cần tạo refresh token
     * @return String refresh token value
     */
    @Transactional
    public String createRefreshToken(User user) {
        log.info("Creating refresh token for user: {}", user.getUsername());

        // Tạo refresh token mới
        String tokenId = UUID.randomUUID().toString();
        String refreshTokenValue = UUID.randomUUID().toString();

        // Lưu vào Redis
        tokenRedisService.saveRefreshToken(tokenId, user.getId(), refreshTokenValue, REFRESH_TOKEN_EXPIRATION);

        log.info("Refresh token created successfully for user: {}", user.getUsername());

        return refreshTokenValue;
    }

    /**
     * Xử lý yêu cầu quên mật khẩu
     */
    public ForgotPasswordResponse processForgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail();
        log.info("Processing forgot password request for email: {}", email);

        // Tìm tất cả user có email này
        List<User> users = userRepository.findAllByEmail(email);

        if (users.isEmpty()) {
            // Không thông báo cụ thể để tránh lộ thông tin
            log.warn("No users found with email: {}", email);
            return ForgotPasswordResponse.builder()
                .success(true)
                .message("Nếu email tồn tại, bạn sẽ nhận được mã xác nhận qua email")
                .build();
        }

        // Tìm tài khoản LOCAL có email này
        Optional<User> localUserOpt = users.stream()
            .filter(u -> u.getAuthProvider() == AuthProvider.LOCAL)
            .findFirst();

        if (localUserOpt.isEmpty()) {
            log.warn("No local account found with email: {}", email);
            return ForgotPasswordResponse.builder()
                .success(false)
                .message("Không tìm thấy tài khoản local với email này. Nếu bạn đã đăng ký bằng mạng xã hội, vui lòng đăng nhập bằng tài khoản mạng xã hội đó.")
                .build();
        }

        User localUser = localUserOpt.get();

        // Tạo mã xác nhận 6 số
        String resetCode = generateRandomCode();

        // Lưu mã vào Redis với thời gian hết hạn
        // Sử dụng email và username của tài khoản local làm key để đảm bảo tính nhất quán
        String redisKey = RESET_CODE_PREFIX + email + ":" + localUser.getUsername();
        redisTemplate.opsForValue().set(redisKey, resetCode, Duration.ofSeconds(CODE_EXPIRY_SECONDS));

        // Gửi sự kiện để notification service gửi email
        passwordResetEventProducer.sendPasswordResetEvent(email, localUser.getDisplayName(), resetCode);

        log.info("Reset code sent to email: {} for local user: {}", email, localUser.getUsername());
        return ForgotPasswordResponse.builder()
            .success(true)
            .message("Mã xác nhận đã được gửi đến email của bạn")
            .build();
    }

    /**
     * Xác thực mã và đặt lại mật khẩu
     */
    @Transactional
    public void verifyCodeAndResetPassword(ResetPasswordRequest request) {
        String email = request.getEmail();
        String code = request.getCode();
        String newPassword = request.getNewPassword();

        log.info("Verifying reset code for email: {}", email);

        // Tìm tất cả user có email này
        List<User> users = userRepository.findAllByEmail(email);

        if (users.isEmpty()) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        // Tìm tài khoản LOCAL có email này
        Optional<User> localUserOpt = users.stream()
            .filter(u -> u.getAuthProvider() == AuthProvider.LOCAL)
            .findFirst();

        if (localUserOpt.isEmpty()) {
            log.warn("No local account found with email: {}", email);
            throw new AppException(ErrorCode.ACCOUNT_NOT_LOCAL);
        }

        User localUser = localUserOpt.get();

        // Lấy mã từ Redis - sử dụng cả email và username để đảm bảo tính nhất quán
        String redisKey = RESET_CODE_PREFIX + email + ":" + localUser.getUsername();
        Object storedCode = redisTemplate.opsForValue().get(redisKey);

        // Kiểm tra mã có tồn tại và khớp không
        if (storedCode == null || !storedCode.toString().equals(code)) {
            log.warn("Invalid or expired reset code for email: {}", email);
            throw new AppException(ErrorCode.INVALID_RESET_CODE);
        }

        // Cập nhật mật khẩu mới
        localUser.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(localUser);

        // Xóa mã khỏi Redis
        redisTemplate.delete(redisKey);

        log.info("Password reset successful for user: {}", localUser.getUsername());
    }

    /**
     * Tạo mã xác nhận ngẫu nhiên 6 số
     */
    private String generateRandomCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // Tạo số ngẫu nhiên từ 100000 đến 999999
        return String.valueOf(code);
    }

    /**
     * Làm mới token dựa trên refresh token
     * @param refreshTokenRequest Yêu cầu làm mới token
     * @return Thông tin xác thực mới
     */
    @Transactional
    public AuthenticationResponse refreshToken(RefreshTokenRequest refreshTokenRequest) {
        log.info("Processing refresh token request");
        String requestToken = refreshTokenRequest.getRefreshToken();

        // Kiểm tra refresh token trong Redis
        String redisToken = tokenRedisService.getRefreshToken(requestToken);
        if (redisToken == null) {
            log.warn("Refresh token not found in Redis: {}", requestToken);
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        // Lấy userId từ refresh token
        String userId = tokenRedisService.getUserIdFromToken(requestToken);
        if (userId == null) {
            log.warn("User ID not found for refresh token: {}", requestToken);
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        // Tìm user trong database
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("User not found with ID: {}", userId);
                    return new AppException(ErrorCode.USER_NOT_EXISTED);
                });

        // Tạo access token mới
        String accessToken = generateToken(user);

        log.info("Token refreshed successfully for user: {}", user.getUsername());

        return AuthenticationResponse.builder()
                .token(accessToken)
                .refreshToken(requestToken) // Giữ nguyên refresh token
                .authenticated(true)
                .expiresIn(ACCESS_TOKEN_EXPIRATION)
                .build();
    }

    /**
     * Tìm kiếm người dùng thông qua tài khoản liên kết
     * @param usernameOrEmail Username hoặc email của tài khoản liên kết
     * @param password Mật khẩu của tài khoản liên kết
     * @return Đối tượng User nếu tìm thấy và xác thực thành công
     * @throws AppException Nếu không tìm thấy hoặc xác thực thất bại
     */
    private User findUserByLinkedAccount(String usernameOrEmail, String password) {
        // Tìm kiếm theo username
        var linkedAccountByUsername =
            linkedAccountRepository.findByProviderAndUsername(AuthProvider.LOCAL, usernameOrEmail);

        if (linkedAccountByUsername.isPresent()) {
            LinkedAccount linkedAccount = linkedAccountByUsername.get();

            // Kiểm tra mật khẩu
            PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
            boolean authenticated = passwordEncoder.matches(password, linkedAccount.getPassword());

            if (!authenticated) {
                log.warn("Authentication failed: Invalid password for linked account {}", usernameOrEmail);
                throw new AppException(ErrorCode.INVALID_CREDENTIALS);
            }

            return linkedAccount.getUser();
        }

        // Tìm kiếm theo email
        var linkedAccountByEmail =
            linkedAccountRepository.findByProviderAndEmail(AuthProvider.LOCAL, usernameOrEmail);

        if (linkedAccountByEmail.isPresent()) {
            LinkedAccount linkedAccount = linkedAccountByEmail.get();

            // Kiểm tra mật khẩu
            PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
            boolean authenticated = passwordEncoder.matches(password, linkedAccount.getPassword());

            if (!authenticated) {
                log.warn("Authentication failed: Invalid password for linked account {}", usernameOrEmail);
                throw new AppException(ErrorCode.INVALID_CREDENTIALS);
            }

            return linkedAccount.getUser();
        }

        // Không tìm thấy tài khoản liên kết
        log.warn("Authentication failed: User not found with username/email - {}", usernameOrEmail);
        throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }
}
