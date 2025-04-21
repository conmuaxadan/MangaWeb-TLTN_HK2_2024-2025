package com.raindrop.manga_service.repository.httpclient;

import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.ReadingHistoryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "profile-service", url = "${app.profile-service.url}")
public interface ProfileClient {
    /**
     * Lấy lịch sử đọc gần đây của người dùng
     * @param userId ID của người dùng
     * @param limit Số lượng bản ghi cần lấy
     * @return Danh sách lịch sử đọc gần đây
     */
    @GetMapping("/users/{userId}/reading-history/recent")
    ApiResponse<List<ReadingHistoryResponse>> getRecentReadingHistory(
            @PathVariable("userId") String userId,
            @RequestParam("limit") int limit);
}
