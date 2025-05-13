package com.raindrop.comment_service.repository.httpclient;

import com.raindrop.comment_service.dto.response.ApiResponse;
import com.raindrop.comment_service.dto.response.ChapterInfoResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "manga-service", url = "${app.services.manga}")
public interface MangaClient {
    /**
     * Lấy thông tin cơ bản của chapter
     * @param chapterId ID của chapter
     * @return Thông tin cơ bản của chapter
     */
    @GetMapping("/chapters/{chapterId}/info")
    ApiResponse<ChapterInfoResponse> getChapterInfo(@PathVariable("chapterId") String chapterId);
}
