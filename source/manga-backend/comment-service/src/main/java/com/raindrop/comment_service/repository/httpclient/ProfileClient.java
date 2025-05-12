package com.raindrop.comment_service.repository.httpclient;

import com.raindrop.comment_service.dto.response.ApiResponse;
import com.raindrop.comment_service.dto.response.UserProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "profile-service", url = "${app.services.profile}")
public interface ProfileClient {

    /**
     * Lấy thông tin profile của người dùng
     * @param token JWT token
     * @param userId ID của người dùng
     * @return Thông tin profile của người dùng
     */
    @GetMapping("/profiles/by-user-id/{userId}")
    ApiResponse<UserProfileResponse> getUserProfile(
            @RequestHeader("Authorization") String token,
            @PathVariable("userId") String userId);
}