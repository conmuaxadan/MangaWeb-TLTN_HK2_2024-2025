package com.raindrop.identity_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.raindrop.common.event.UserEvent;
import com.raindrop.identity_service.dto.request.GoogleAuthenticationRequest;
import com.raindrop.identity_service.dto.response.AuthenticationResponse;
import com.raindrop.identity_service.dto.response.GoogleUserInfoResponse;
import com.raindrop.identity_service.entity.Role;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.enums.AuthProvider;
import com.raindrop.identity_service.enums.ErrorCode;
import com.raindrop.identity_service.exception.AppException;
import com.raindrop.identity_service.entity.LinkedAccount;
import com.raindrop.identity_service.kafka.UserEventProducer;
import com.raindrop.identity_service.repository.LinkedAccountRepository;
import com.raindrop.identity_service.repository.RoleRepository;
import com.raindrop.identity_service.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class GoogleAuthService {
    AuthenticationService authenticationService;
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    LinkedAccountRepository linkedAccountRepository;
    RoleRepository roleRepository;

    UserEventProducer userEventProducer;

    @Value("${google.client-id}")
    @NonFinal
    String clientId;

    @Value("${google.client-secret}")
    @NonFinal
    String clientSecret;

    @Value("${google.token-uri}")
    @NonFinal
    String tokenUri;

    @Value("${google.user-info-uri}")
    @NonFinal
    String userInfoUri;

    ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Xử lý đăng nhập Google
     *
     * @param code        Mã xác thực từ Google
     * @param redirectUri URI chuyển hướng
     * @return Thông tin xác thực
     */
    @Transactional
    public AuthenticationResponse googleLogin(String code, String redirectUri) {
        try {
            log.info("Processing Google login request");
            // Lấy thông tin người dùng từ Google
            GoogleUserInfoResponse googleUserInfo = getGoogleUserInfo(code, redirectUri);
            // Tìm tài khoản đã liên kết với Google ID này
            var linkedAccount = linkedAccountRepository.findByProviderAndProviderUserId(
                    AuthProvider.GOOGLE, googleUserInfo.getGoogleId());
            User user;

            if (linkedAccount.isPresent()) {
                // Nếu đã liên kết, lấy user chính
                user = linkedAccount.get().getUser();
                log.info("Found linked account for Google ID: {}", googleUserInfo.getGoogleId());
            } else {
                // Tìm user có email trùng với Google
                var existingUser = userRepository.findByEmail(googleUserInfo.getEmail());
                if (existingUser.isPresent()) {
                    user = existingUser.get();
                    // Chỉ tự động liên kết nếu tài khoản hiện có là LOCAL
                    if (user.getAuthProvider() == AuthProvider.LOCAL) {
                        // Tạo liên kết mới
                        LinkedAccount newLink = LinkedAccount.builder()
                                .user(user)
                                .provider(AuthProvider.GOOGLE)
                                .email(googleUserInfo.getEmail())
                                .providerUserId(googleUserInfo.getGoogleId())
                                .build();
                        linkedAccountRepository.save(newLink);
                        log.info("Auto-linked Google account to existing LOCAL user with email: {}", googleUserInfo.getEmail());
                    } else {
                        log.info("Found existing user with matching email but not LOCAL provider: {}", googleUserInfo.getEmail());
                    }
                } else {
                    // Nếu không tìm thấy, tạo user mới
                    user = createNewGoogleUser(googleUserInfo);
                    log.info("Created new user from Google authentication: {}", googleUserInfo.getEmail());
                }
            }
            // Xác thực người dùng
            GoogleAuthenticationRequest googleAuthRequest = GoogleAuthenticationRequest.builder()
                    .username(user.getUsername())
                    .build();

            return authenticationService.googleAuthenticate(googleAuthRequest);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error during Google login: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.GOOGLE_LOGIN_ERROR);
        }
    }


    /**
     * Lấy thông tin người dùng từ Google
     *
     * @param code        Mã xác thực từ Google
     * @param redirectUri URI chuyển hướng
     * @return Thông tin người dùng Google
     */
    public GoogleUserInfoResponse getGoogleUserInfo(String code, String redirectUri) {
        try {
            // Đổi code lấy token từ Google
            String tokenResponse = exchangeCodeForToken(code, redirectUri);
            JsonNode tokenJson = parseAndValidateJsonResponse(tokenResponse, ErrorCode.GOOGLE_TOKEN_ERROR, "Google OAuth error");

            String accessToken = tokenJson.get("access_token").asText();

            // Lấy thông tin user từ Google
            String userInfoResponse = getUserInfo(accessToken);
            JsonNode userJson = parseAndValidateJsonResponse(userInfoResponse, ErrorCode.GOOGLE_USER_INFO_ERROR, "Google User Info error");

            log.info(userJson.toString());

            String email = userJson.get("email").asText();
            String name = userJson.get("name") != null ? userJson.get("name").asText() : email;
            String googleId = userJson.get("sub").asText();
            String picture = userJson.get("picture").asText();

            log.info("User authenticated via Google - Email: {}, Google ID: {}", email, googleId);

            return GoogleUserInfoResponse.builder()
                    .email(email)
                    .name(name)
                    .googleId(googleId)
                    .picture(picture)
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
     *
     * @param jsonResponse Phản hồi JSON
     * @param errorCode    Mã lỗi nếu có lỗi
     * @param errorPrefix  Tiền tố lỗi cho log
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
     * Tạo người dùng mới từ thông tin Google
     *
     * @param googleUserInfo Thông tin người dùng Google
     * @return Đối tượng User mới
     */
    private User createNewGoogleUser(GoogleUserInfoResponse googleUserInfo) {
        // Tìm kiếm role USER đã tồn tại trong cơ sở dữ liệu
        var roles = new HashSet<Role>();
        Role userRole = roleRepository.findByName("USER");
        if (userRole == null) {
            log.error("Default USER role not found in database");
            throw new AppException(ErrorCode.ROLE_NOT_FOUND);
        }
        roles.add(userRole);

        // Kiểm tra và tạo displayName độc nhất
        String displayName = googleUserInfo.getName();

        // Đảm bảo displayName có độ dài hợp lệ (6-16 ký tự)
        if (displayName == null || displayName.trim().isEmpty() || displayName.length() < 6) {
            // Nếu displayName quá ngắn, sử dụng email làm căn cứ
            String emailPrefix = googleUserInfo.getEmail().split("@")[0];
            displayName = emailPrefix;

            // Đảm bảo độ dài tối thiểu là 6
            if (displayName.length() < 6) {
                displayName = displayName + "User" + (int)(Math.random() * 1000);
            }
        }

        // Nếu displayName quá dài, cắt bớt xuống 16 ký tự
        if (displayName.length() > 16) {
            displayName = displayName.substring(0, 16);
        }

        String originalDisplayName = displayName;
        int counter = 1;

        // Nếu displayName đã tồn tại, thêm số vào sau
        while (userRepository.existsByDisplayName(displayName)) {
            // Tạo phiên bản mới của displayName
            if (originalDisplayName.length() + String.valueOf(counter).length() > 16) {
                // Nếu thêm số sẽ làm displayName vượt quá 16 ký tự, cắt bớt originalDisplayName
                int maxLength = 16 - String.valueOf(counter).length();
                displayName = originalDisplayName.substring(0, maxLength) + counter;
            } else {
                displayName = originalDisplayName + counter;
            }
            counter++;
            log.debug("Display name already exists, trying: {}", displayName);
        }

        User user = User.builder()
                .username(googleUserInfo.getEmail())
                .email(googleUserInfo.getEmail())
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .authProvider(AuthProvider.GOOGLE)
                .roles(roles)
                .displayName(displayName) // Sử dụng displayName đã được kiểm tra tính độc nhất
                .avatarUrl(googleUserInfo.getPicture())
                .build();
        userRepository.save(user);

        UserEvent userEvent = UserEvent.builder()
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .build();
        userEventProducer.sendNewUserEvent(userEvent);
        return user;
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