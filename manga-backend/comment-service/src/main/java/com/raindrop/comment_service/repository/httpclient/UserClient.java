package com.raindrop.comment_service.repository.httpclient;

import com.raindrop.comment_service.dto.response.ApiResponse;
import com.raindrop.comment_service.dto.response.UserCommentResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "identity-service", url = "${app.services.identity}")
public interface UserClient {

    /**
     * Lấy thông tin profile của người dùng
     * @param userId ID của người dùng
     * @return Thông tin profile của người dùng
     */
    @GetMapping("/users/comment/{userId}")
    ApiResponse<UserCommentResponse> getUserProfile(
            @PathVariable("userId") String userId);
}