package com.raindrop.manga_service.controller;

import com.raindrop.manga_service.dto.request.ChapterRequest;
import com.raindrop.manga_service.dto.request.MangaRequest;
import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.ChapterResponse;
import com.raindrop.manga_service.repository.ChapterRepository;
import com.raindrop.manga_service.service.ChapterService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chapters")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class ChapterController {
    ChapterService chapterService;

    @PostMapping()
    ApiResponse<ChapterResponse> createChapter(@RequestBody @Valid ChapterRequest request) {
        return ApiResponse.<ChapterResponse>builder()
                .message("Chapter created successfully")
                .result(chapterService.createChapter(request))
                .build();
    }
}
