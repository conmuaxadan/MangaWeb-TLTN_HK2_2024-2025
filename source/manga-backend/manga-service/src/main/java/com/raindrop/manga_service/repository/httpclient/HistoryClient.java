package com.raindrop.manga_service.repository.httpclient;

import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.ReadingHistoryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "history-service", url = "${app.services.history}")
public interface HistoryClient {
    /**
     * Lấy lịch sử đọc gần đây của người dùng
     * @param userId ID của người dùng
     * @param limit Số lượng bản ghi cần lấy
     * @return Danh sách lịch sử đọc gần đây
     */
    @GetMapping("/reading-histories/user/{userId}/recent")
    ApiResponse<List<ReadingHistoryResponse>> getRecentReadingHistory(
            @RequestHeader("Authorization") String token,
            @PathVariable("userId") String userId,
            @RequestParam("limit") int limit);

    /**
     * Lấy tất cả mangaId đã đọc của người dùng
     * @param userId ID của người dùng
     * @return Danh sách tất cả mangaId đã đọc
     */
    @GetMapping("/reading-histories/user/{userId}/manga-ids")
    ApiResponse<List<String>> getAllReadMangaIds(
            @RequestHeader("Authorization") String token,
            @PathVariable("userId") String userId);
}
