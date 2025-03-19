package com.raindrop.identity_service.controller;

import com.nimbusds.jose.JOSEException;
import com.raindrop.identity_service.dto.request.AuthenticationRequest;
import com.raindrop.identity_service.dto.request.GoogleLoginRequest;
import com.raindrop.identity_service.dto.request.IntrospectRequest;
import com.raindrop.identity_service.dto.request.LogoutRequest;
import com.raindrop.identity_service.dto.response.ApiResponse;
import com.raindrop.identity_service.dto.response.AuthenticationResponse;
import com.raindrop.identity_service.dto.response.IntrospectResponse;
import com.raindrop.identity_service.service.AuthenticationService;
import com.raindrop.identity_service.service.GoogleAuthService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AuthenticationController {
    AuthenticationService authenticationService;
    GoogleAuthService googleAuthService;

    @PostMapping("/login")
    ApiResponse<AuthenticationResponse> login(@RequestBody AuthenticationRequest request) {
        var result = authenticationService.authenticate(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }

    @PostMapping("/google-login")
    public ApiResponse<AuthenticationResponse> googleLogin(@RequestBody GoogleLoginRequest request) throws Exception {
        var result = googleAuthService.googleLogin(request.getCode(), request.getRedirectUri());
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }


    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request) throws ParseException, JOSEException {
        var result = authenticationService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder()
                .result(result)
                .build();
    }

    @PostMapping("/logout")
    ApiResponse<Void> logout(@RequestBody LogoutRequest request) throws ParseException, JOSEException {
        authenticationService.logout(request);
        return ApiResponse.<Void>builder()
                .build();
    }
}
