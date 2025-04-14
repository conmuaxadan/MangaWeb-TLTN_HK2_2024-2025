package com.raindrop.profile_service.repository.httpclient;

import com.raindrop.profile_service.dto.response.manga.ApiResponse;
import com.raindrop.profile_service.dto.response.ChapterInfoResponse;
import com.raindrop.profile_service.dto.response.MangaInfoResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "manga-service", url = "${app.services.manga}")
public interface MangaClient {

    @GetMapping("/mangas/{id}")
    ApiResponse<MangaInfoResponse> getMangaById(@PathVariable String id);

    @GetMapping("/chapters/{id}")
    ApiResponse<ChapterInfoResponse> getChapterById(@PathVariable String id);
}
