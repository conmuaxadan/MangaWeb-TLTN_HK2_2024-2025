package com.raindrop.profile_service.client;

import com.raindrop.profile_service.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "manga-service", url = "${app.services.manga}")
public interface MangaClient {
    /**
     * Lấy thông tin manga theo ID
     */
    @GetMapping("/mangas/{id}")
    ApiResponse<MangaResponse> getMangaById(@PathVariable("id") String id);
    
    /**
     * Lấy thông tin chapter theo ID
     */
    @GetMapping("/chapters/{id}")
    ApiResponse<ChapterResponse> getChapterById(@PathVariable("id") String id);
    
    /**
     * DTO cho thông tin manga
     */
    record MangaResponse(
            String id,
            String title,
            String description,
            String author,
            String coverUrl
    ) {}
    
    /**
     * DTO cho thông tin chapter
     */
    record ChapterResponse(
            String id,
            String mangaId,
            Integer chapterNumber,
            String title
    ) {}
}
