package com.raindrop.identity_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.raindrop.identity_service.dto.request.AuthenticationRequest;
import com.raindrop.identity_service.dto.request.UserRequest;
import com.raindrop.identity_service.dto.response.AuthenticationResponse;
import com.raindrop.identity_service.entity.Role;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
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

    public AuthenticationResponse googleLogin(String code, String redirectUri) throws Exception {
        // Đổi code lấy token từ Google
        String tokenResponse = exchangeCodeForToken(code, redirectUri);
        JsonNode tokenJson = objectMapper.readTree(tokenResponse);
        String accessToken = tokenJson.get("access_token").asText();
        String idToken = tokenJson.get("id_token").asText();

        // Lấy thông tin user từ Google
        String userInfo = getUserInfo(accessToken);
        JsonNode userJson = objectMapper.readTree(userInfo);
        String email = userJson.get("email").asText();
        String name = userJson.get("name").asText();
        String googleId = userJson.get("sub").asText();

        System.out.println("User Info - Email: " + email + ", Name: " + name + ", Google ID: " + googleId);

        User user = userRepository.findByUsername(email).orElse(null);

        if (user == null) {
            var roles = new HashSet<Role>();
            roles.add(Role.builder().name("USER").build());
            userRepository.save(User.builder()
                    .username(email)
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .build());
        }

        AuthenticationRequest authenticationRequest = AuthenticationRequest.builder()
                .username(email)
                .build();

        return authenticationService.authenticateGG(authenticationRequest);
    }


    private String exchangeCodeForToken(String code, String redirectUri) throws Exception {
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
            return EntityUtils.toString(response.getEntity());
        }
    }

    private String getUserInfo(String accessToken) throws Exception {
        CloseableHttpClient httpClient = HttpClients.createDefault();
        HttpPost httpPost = new HttpPost(userInfoUri);
        httpPost.setHeader("Authorization", "Bearer " + accessToken);

        try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
            return EntityUtils.toString(response.getEntity());
        }
    }

    private String generateAppToken(String googleId, String email) {
        // Tạm thời trả về chuỗi đơn giản, thay bằng JWT nếu cần
        return "jwt-token-for-" + googleId;
    }
}