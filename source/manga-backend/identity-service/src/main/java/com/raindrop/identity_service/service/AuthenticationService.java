package com.raindrop.identity_service.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.raindrop.identity_service.dto.request.AuthenticationRequest;
import com.raindrop.identity_service.dto.request.GoogleAuthenticationRequest;
import com.raindrop.identity_service.dto.request.IntrospectRequest;
import com.raindrop.identity_service.dto.request.LogoutRequest;
import com.raindrop.identity_service.dto.request.RefreshTokenRequest;
import com.raindrop.identity_service.dto.response.AuthenticationResponse;
import com.raindrop.identity_service.dto.response.IntrospectResponse;
import com.raindrop.identity_service.entity.InvalidatedToken;
import com.raindrop.identity_service.entity.RefreshToken;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.exception.AppException;
import com.raindrop.identity_service.enums.ErrorCode;
import com.raindrop.identity_service.repository.InvalidatedTokenRepository;
import com.raindrop.identity_service.repository.RefreshTokenRepository;
import com.raindrop.identity_service.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.client.RestClient;

import java.text.ParseException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = lombok.AccessLevel.PRIVATE)
public class AuthenticationService {
    UserRepository userRepository;
    InvalidatedTokenRepository invalidatedTokenRepository;
    RefreshTokenRepository refreshTokenRepository;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    // Thời gian sống của access token (1 giờ)
    private static final long ACCESS_TOKEN_EXPIRATION = 60 * 60; // 1 giờ tính bằng giây

    // Thời gian sống của refresh token (7 ngày)
    private static final long REFRESH_TOKEN_EXPIRATION = 7 * 24 * 60 * 60; // 7 ngày tính bằng giây

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
        log.info("Authenticating user: {}", request.getUsername());
        var user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> {
            log.warn("Authentication failed: User not found - {}", request.getUsername());
            return new AppException(ErrorCode.INVALID_CREDENTIALS);
        });

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!authenticated) {
            log.warn("Authentication failed: Invalid password for user {}", request.getUsername());
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        log.info("User authenticated successfully: {}", request.getUsername());

        // Tạo access token
        var accessToken = generateToken(user);

        // Tạo refresh token
        var refreshToken = createRefreshToken(user);

        return AuthenticationResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken.getToken())
                .authenticated(true)
                .expiresIn(ACCESS_TOKEN_EXPIRATION)
                .build();
    }

    @Transactional
    public AuthenticationResponse authenticateGG(GoogleAuthenticationRequest request) {
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
                .refreshToken(refreshToken.getToken())
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

        // Thêm token vào danh sách token đã bị vô hiệu hóa
        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(jit)
                .expiryTime(expirationTime)
                .build();
        invalidatedTokenRepository.save(invalidatedToken);

        // Thu hồi tất cả refresh token của người dùng
        User user = userRepository.findById(subject).orElse(null);
        if (user != null) {
            refreshTokenRepository.revokeAllUserTokens(user);
            log.info("All refresh tokens revoked for user: {}", subject);
        }

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

        if (invalidatedTokenRepository.existsById(tokenId)) {
            log.warn("Token verification failed: Token has been invalidated for user {}", subject);
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
     * @return RefreshToken đã được lưu vào database
     */
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        log.info("Creating refresh token for user: {}", user.getUsername());

        // Tạo refresh token mới
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(LocalDateTime.now().plusSeconds(REFRESH_TOKEN_EXPIRATION))
                .revoked(false)
                .build();

        // Lưu vào database
        refreshToken = refreshTokenRepository.save(refreshToken);
        log.info("Refresh token created successfully for user: {}, expires at: {}",
                user.getUsername(), refreshToken.getExpiryDate());

        return refreshToken;
    }

    /**
     * Làm mới token dựa trên refresh token
     * @param refreshTokenRequest Yêu cầu làm mới token
     * @return Thông tin xác thực mới
     */
    @Transactional
    public AuthenticationResponse refreshToken(RefreshTokenRequest refreshTokenRequest) {
        log.info("Processing refresh token request");

        // Tìm refresh token trong database
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenRequest.getRefreshToken())
                .orElseThrow(() -> {
                    log.warn("Refresh token not found: {}", refreshTokenRequest.getRefreshToken());
                    return new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
                });

        // Kiểm tra refresh token có hợp lệ không
        if (refreshToken.isRevoked()) {
            log.warn("Refresh token has been revoked: {}", refreshToken.getToken());
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        if (refreshToken.isExpired()) {
            log.warn("Refresh token has expired: {}", refreshToken.getToken());
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        // Tạo access token mới
        User user = refreshToken.getUser();
        String accessToken = generateToken(user);

        log.info("Token refreshed successfully for user: {}", user.getUsername());

        return AuthenticationResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken.getToken()) // Giữ nguyên refresh token
                .authenticated(true)
                .expiresIn(ACCESS_TOKEN_EXPIRATION)
                .build();
    }


}
