package com.raindrop.favorite_service.repository.httpclient;

import com.raindrop.favorite_service.dto.request.UserEmailRequest;
import com.raindrop.favorite_service.dto.response.ApiResponse;
import com.raindrop.favorite_service.dto.response.UserEmailResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "identity-service", url = "${app.services.identity}")
public interface UserClient {

    /**
     * Lấy thông tin email và display name của nhiều người dùng
     * @param request Danh sách user IDs
     * @return Thông tin email và display name của các người dùng
     */
    @PostMapping("/users/internal/user/email")
    ApiResponse<UserEmailResponse> getUserInfoById(@RequestBody UserEmailRequest request);
}
