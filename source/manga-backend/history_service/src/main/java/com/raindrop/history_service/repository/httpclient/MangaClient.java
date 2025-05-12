package com.raindrop.history_service.repository.httpclient;

import com.raindrop.history_service.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "manga-service", url = "${app.services.manga}")
public interface MangaClient {

    @GetMapping("/mangas/{mangaId}")
    ApiResponse<?> getMangaById(@PathVariable String mangaId);
    
    @GetMapping("/chapters/{chapterId}")
    ApiResponse<?> getChapterById(@PathVariable String chapterId);
}
