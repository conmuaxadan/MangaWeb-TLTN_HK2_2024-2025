package com.raindrop.identity_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.raindrop.identity_service.dto.request.AuthenticationRequest;
import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.AuthenticationResponse;
import com.raindrop.identity_service.entity.Role;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.enums.ErrorCode;
import com.raindrop.identity_service.exception.AppException;
import com.raindrop.identity_service.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class GoogleAuthService {
    final AuthenticationService authenticationService;
    final UserRepository userRepository;
    final PasswordEncoder passwordEncoder;

    @Value("${google.client-id}")
    String clientId;

    @Value("${google.client-secret}")
    String clientSecret;

    @Value("${google.token-uri}")
    String tokenUri;

    @Value("${google.user-info-uri}")
    String userInfoUri;

    final ObjectMapper objectMapper = new ObjectMapper();

    public AuthenticationResponse googleLogin(String code, String redirectUri) {
        try {
            log.info("Processing Google login with code: {}", code.substring(0, Math.min(code.length(), 10)) + "...");

            // Đổi code lấy token từ Google
            String tokenResponse;
            try {
                tokenResponse = exchangeCodeForToken(code, redirectUri);
            } catch (Exception e) {
                log.error("Error exchanging code for token: {}", e.getMessage());
                throw new AppException(ErrorCode.GOOGLE_TOKEN_ERROR);
            }

            JsonNode tokenJson;
            try {
                tokenJson = objectMapper.readTree(tokenResponse);

                // Kiểm tra lỗi từ Google
                if (tokenJson.has("error")) {
                    String error = tokenJson.get("error").asText();
                    String errorDescription = tokenJson.has("error_description") ?
                            tokenJson.get("error_description").asText() : "Unknown error";
                    log.error("Google OAuth error: {} - {}", error, errorDescription);
                    throw new AppException(ErrorCode.GOOGLE_TOKEN_ERROR);
                }

            } catch (Exception e) {
                log.error("Error parsing token response: {}", e.getMessage());
                throw new AppException(ErrorCode.GOOGLE_TOKEN_ERROR);
            }

            String accessToken = tokenJson.get("access_token").asText();
            String idToken = tokenJson.get("id_token").asText();

            // Lấy thông tin user từ Google
            String userInfo;
            try {
                userInfo = getUserInfo(accessToken);
            } catch (Exception e) {
                log.error("Error getting user info: {}", e.getMessage());
                throw new AppException(ErrorCode.GOOGLE_USER_INFO_ERROR);
            }

            JsonNode userJson;
            try {
                userJson = objectMapper.readTree(userInfo);

                // Kiểm tra lỗi từ Google
                if (userJson.has("error")) {
                    String error = userJson.get("error").asText();
                    String errorDescription = userJson.has("error_description") ?
                            userJson.get("error_description").asText() : "Unknown error";
                    log.error("Google User Info error: {} - {}", error, errorDescription);
                    throw new AppException(ErrorCode.GOOGLE_USER_INFO_ERROR);
                }

            } catch (Exception e) {
                log.error("Error parsing user info: {}", e.getMessage());
                throw new AppException(ErrorCode.GOOGLE_USER_INFO_ERROR);
            }

            String email = userJson.get("email").asText();
            String name = userJson.get("name") != null ? userJson.get("name").asText() : email;
            String googleId = userJson.get("sub").asText();

            log.info("User authenticated via Google - Email: {}, Google ID: {}", email, googleId);

            // Tìm hoặc tạo user
            User user = userRepository.findByUsername(email).orElse(null);

            if (user == null) {
                log.info("Creating new user from Google authentication: {}", email);
                var roles = new HashSet<Role>();
                roles.add(Role.builder().name("USER").build());
                user = User.builder()
                        .username(email)
                        .email(email)
                        .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .roles(roles)
                        .build();
                userRepository.save(user);
                log.info("New user created successfully: {}", email);
            }

            AuthenticationRequest authenticationRequest = AuthenticationRequest.builder()
                    .username(email)
                    .build();

            return authenticationService.authenticateGG(authenticationRequest);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during Google authentication", e);
            throw new AppException(ErrorCode.GOOGLE_AUTH_ERROR);
        }
    }


    private String exchangeCodeForToken(String code, String redirectUri) throws Exception {
        log.debug("Exchanging code for token with Google OAuth");
        CloseableHttpClient httpClient = HttpClients.createDefault();
        HttpPost httpPost = new HttpPost(tokenUri);
        httpPost.setHeader("Content-Type", "application/json");

        String json = "{"
                + "\"code\": \"" + code + "\","
                + "\"client_id\": \"" + clientId + "\","
                + "\"client_secret\": \"" + clientSecret + "\","
                + "\"redirect_uri\": \"" + redirectUri + "\","
                + "\"grant_type\": \"authorization_code\""
                + "}";
        httpPost.setEntity(new StringEntity(json));

        try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
            int statusCode = response.getStatusLine().getStatusCode();
            String responseBody = EntityUtils.toString(response.getEntity());

            if (statusCode < 200 || statusCode >= 300) {
                log.error("Error response from Google token endpoint: {} - {}", statusCode, responseBody);
                throw new Exception("Google token endpoint returned status code: " + statusCode);
            }

            return responseBody;
        } catch (Exception e) {
            log.error("Exception during token exchange: {}", e.getMessage());
            throw e;
        }
    }

    private String getUserInfo(String accessToken) throws Exception {
        log.debug("Fetching user info from Google");
        CloseableHttpClient httpClient = HttpClients.createDefault();
        HttpPost httpPost = new HttpPost(userInfoUri);
        httpPost.setHeader("Authorization", "Bearer " + accessToken);

        try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
            int statusCode = response.getStatusLine().getStatusCode();
            String responseBody = EntityUtils.toString(response.getEntity());

            if (statusCode < 200 || statusCode >= 300) {
                log.error("Error response from Google user info endpoint: {} - {}", statusCode, responseBody);
                throw new Exception("Google user info endpoint returned status code: " + statusCode);
            }

            return responseBody;
        } catch (Exception e) {
            log.error("Exception during user info fetch: {}", e.getMessage());
            throw e;
        }
    }

    private String generateAppToken(String googleId, String email) {
        // Tạm thời trả về chuỗi đơn giản, thay bằng JWT nếu cần
        return "jwt-token-for-" + googleId;
    }
}