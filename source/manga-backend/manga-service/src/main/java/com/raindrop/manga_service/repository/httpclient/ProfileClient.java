package com.raindrop.manga_service.repository.httpclient;

import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.ReadingHistoryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "profile-service", url = "${app.profile-service.url}",configuration = com.raindrop.manga_service.configuration.FeignClientConfig.class)
public interface ProfileClient {
    /**
     * Lấy lịch sử đọc gần đây của người dùng
     * @param userId ID của người dùng
     * @param limit Số lượng bản ghi cần lấy
     * @return Danh sách lịch sử đọc gần đây
     */
    @GetMapping("/reading-history/users/{userId}/recent")
    ApiResponse<List<ReadingHistoryResponse>> getRecentReadingHistory(
            @PathVariable("userId") String userId,
            @RequestParam("limit") int limit);

    /**
     * Lấy tất cả mangaId đã đọc của người dùng
     * @param userId ID của người dùng
     * @return Danh sách tất cả mangaId đã đọc
     */
    @GetMapping("/reading-history/users/{userId}/all-read-manga-ids")
    ApiResponse<List<String>> getAllReadMangaIds(
            @PathVariable("userId") String userId);
}
