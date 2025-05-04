package com.raindrop.identity_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.raindrop.common.event.UserProfileEvent;
import com.raindrop.identity_service.dto.request.GoogleAuthenticationRequest;
import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.AuthenticationResponse;
import com.raindrop.identity_service.dto.response.GoogleUserInfoResponse;
import com.raindrop.identity_service.entity.Role;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.enums.ErrorCode;
import com.raindrop.identity_service.exception.AppException;
import com.raindrop.identity_service.mapper.ProfileMapper;
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
import com.raindrop.identity_service.kafka.UserProfileEventProducer;
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
    final UserProfileEventProducer userProfileEventProducer;

    @Value("${google.client-id}")
    String clientId;

    @Value("${google.client-secret}")
    String clientSecret;

    @Value("${google.token-uri}")
    String tokenUri;

    @Value("${google.user-info-uri}")
    String userInfoUri;

    final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Xử lý đăng nhập Google
     * @param code Mã xác thực từ Google
     * @param redirectUri URI chuyển hướng
     * @return Thông tin xác thực
     */
    public AuthenticationResponse googleLogin(String code, String redirectUri) {
        try {
            log.info("Processing Google login with code: {}", code.substring(0, Math.min(code.length(), 10)) + "...");

            // Lấy thông tin người dùng từ Google
            GoogleUserInfoResponse googleUserInfo = getGoogleUserInfo(code, redirectUri);

            // Tìm hoặc tạo người dùng
            User user = findOrCreateUser(googleUserInfo);

            // Xác thực người dùng
            GoogleAuthenticationRequest googleAuthRequest = GoogleAuthenticationRequest.builder()
                    .username(googleUserInfo.getEmail())
                    .build();

            return authenticationService.authenticateGG(googleAuthRequest);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during Google authentication", e);
            throw new AppException(ErrorCode.GOOGLE_AUTH_ERROR);
        }
    }

    /**
     * Lấy thông tin người dùng từ Google
     * @param code Mã xác thực từ Google
     * @param redirectUri URI chuyển hướng
     * @return Thông tin người dùng Google
     */
    private GoogleUserInfoResponse getGoogleUserInfo(String code, String redirectUri) {
        try {
            // Đổi code lấy token từ Google
            String tokenResponse = exchangeCodeForToken(code, redirectUri);
            JsonNode tokenJson = parseAndValidateJsonResponse(tokenResponse, ErrorCode.GOOGLE_TOKEN_ERROR, "Google OAuth error");

            String accessToken = tokenJson.get("access_token").asText();

            // Lấy thông tin user từ Google
            String userInfoResponse = getUserInfo(accessToken);
            JsonNode userJson = parseAndValidateJsonResponse(userInfoResponse, ErrorCode.GOOGLE_USER_INFO_ERROR, "Google User Info error");

            String email = userJson.get("email").asText();
            String name = userJson.get("name") != null ? userJson.get("name").asText() : email;
            String googleId = userJson.get("sub").asText();

            log.info("User authenticated via Google - Email: {}, Google ID: {}", email, googleId);

            return GoogleUserInfoResponse.builder()
                    .email(email)
                    .name(name)
                    .googleId(googleId)
                    .build();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting Google user info: {}", e.getMessage());
            throw new AppException(ErrorCode.GOOGLE_USER_INFO_ERROR);
        }
    }

    /**
     * Phân tích và xác thực phản hồi JSON
     * @param jsonResponse Phản hồi JSON
     * @param errorCode Mã lỗi nếu có lỗi
     * @param errorPrefix Tiền tố lỗi cho log
     * @return JsonNode đã phân tích
     */
    private JsonNode parseAndValidateJsonResponse(String jsonResponse, ErrorCode errorCode, String errorPrefix) {
        try {
            JsonNode jsonNode = objectMapper.readTree(jsonResponse);

            // Kiểm tra lỗi từ Google
            if (jsonNode.has("error")) {
                String error = jsonNode.get("error").asText();
                String errorDescription = jsonNode.has("error_description") ?
                        jsonNode.get("error_description").asText() : "Unknown error";
                log.error("{}: {} - {}", errorPrefix, error, errorDescription);
                throw new AppException(errorCode);
            }

            return jsonNode;
        } catch (Exception e) {
            log.error("Error parsing JSON response: {}", e.getMessage());
            throw new AppException(errorCode);
        }
    }

    /**
     * Tìm hoặc tạo người dùng từ thông tin Google
     * @param googleUserInfo Thông tin người dùng Google
     * @return Đối tượng User
     */
    private User findOrCreateUser(GoogleUserInfoResponse googleUserInfo) {
        User user = userRepository.findByUsername(googleUserInfo.getEmail()).orElse(null);

        if (user == null) {
            log.info("Creating new user from Google authentication: {}", googleUserInfo.getEmail());
            var roles = new HashSet<Role>();
            roles.add(Role.builder().name("USER").build());
            user = User.builder()
                    .username(googleUserInfo.getEmail())
                    .email(googleUserInfo.getEmail())
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .roles(roles)
                    .build();
            userRepository.save(user);

            createUserProfile(user, googleUserInfo.getName());
        }

        return user;
    }

    /**
     * Tạo hồ sơ người dùng
     * @param user Đối tượng User
     * @param displayName Tên hiển thị
     */
    private void createUserProfile(User user, String displayName) {
        UserProfileEvent profileEvent = UserProfileEvent.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .displayName(displayName)
                .avatarUrl(null)
                .build();

        log.info("Creating user profile for user: {}", profileEvent.getEmail());

        //Publish message to Kafka
        userProfileEventProducer.sendUserProfileEvent(profileEvent);
        log.info("New user created successfully: {}", user.getEmail());
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



}