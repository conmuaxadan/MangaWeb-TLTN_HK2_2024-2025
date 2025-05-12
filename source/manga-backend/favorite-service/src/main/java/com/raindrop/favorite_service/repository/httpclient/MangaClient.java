package com.raindrop.favorite_service.repository.httpclient;

import com.raindrop.favorite_service.dto.response.ApiResponse;
import com.raindrop.favorite_service.dto.response.MangaInfoResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "manga-service", url = "${app.services.manga}")
public interface MangaClient {

    @GetMapping("/mangas/{id}")
    ApiResponse<MangaInfoResponse> getMangaById(@PathVariable String id);
}
