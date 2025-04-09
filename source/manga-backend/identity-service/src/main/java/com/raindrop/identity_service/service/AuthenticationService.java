package com.raindrop.identity_service.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.raindrop.identity_service.dto.request.AuthenticationRequest;
import com.raindrop.identity_service.dto.request.IntrospectRequest;
import com.raindrop.identity_service.dto.request.LogoutRequest;
import com.raindrop.identity_service.dto.response.AuthenticationResponse;
import com.raindrop.identity_service.dto.response.IntrospectResponse;
import com.raindrop.identity_service.entity.InvalidatedToken;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.exception.AppException;
import com.raindrop.identity_service.enums.ErrorCode;
import com.raindrop.identity_service.repository.InvalidatedTokenRepository;
import com.raindrop.identity_service.repository.UserRepository;
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
    private final RestClient.Builder builder;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

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

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        log.info("Authenticating user: {}", request.getUsername());
        var user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> {
            log.warn("Authentication failed: User not found - {}", request.getUsername());
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        });

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!authenticated) {
            log.warn("Authentication failed: Invalid password for user {}", request.getUsername());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        log.info("User authenticated successfully: {}", request.getUsername());
        var token = generateToken(user);

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }

    public AuthenticationResponse authenticateGG(AuthenticationRequest request) {
        log.info("Authenticating Google user: {}", request.getUsername());
        var user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> {
            log.warn("Google authentication failed: User not found - {}", request.getUsername());
            return new AppException(ErrorCode.USER_NOT_EXISTED);
        });

        log.info("Google user authenticated successfully: {}", request.getUsername());
        var token = generateToken(user);

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }



    public void logout(LogoutRequest request) throws JOSEException, ParseException {
        log.info("Processing logout request");
        var signToken = verifyToken(request.getToken());

        String jit = signToken.getJWTClaimsSet().getJWTID();
        String subject = signToken.getJWTClaimsSet().getSubject();
        Date expirationTime = signToken.getJWTClaimsSet().getExpirationTime();

        log.info("Invalidating token for user: {}", subject);

        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(jit)
                .expiryTime(expirationTime)
                .build();
        invalidatedTokenRepository.save(invalidatedToken);

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
                .subject(user.getUsername())
                .issuer("raindrop.com")
                .issueTime(issuedAt)
                .expirationTime(expirationTime)
                .jwtID(tokenId)
                .claim("scope", buildScope(user))
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

}
