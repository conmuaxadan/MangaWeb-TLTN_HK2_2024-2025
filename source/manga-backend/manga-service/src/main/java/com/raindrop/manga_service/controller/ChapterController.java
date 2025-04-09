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
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/chapters")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class ChapterController {
    ChapterService chapterService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    ApiResponse<ChapterResponse> createChapter(
            @RequestParam("chapterNumber") String chapterNumber,
            @RequestParam("mangaId") String mangaId,
            @RequestParam("pages") List<MultipartFile> pages
    ) {
        ChapterRequest request = ChapterRequest.builder()
                .chapterNumber(Integer.parseInt(chapterNumber))
                .title("Chương " + chapterNumber)
                .mangaId(mangaId)
                .pages(pages)
                .build();

        log.info("Create chapter request: {}", request);

        return ApiResponse.<ChapterResponse>builder()
                .message("Chapter created successfully")
                .result(chapterService.createChapter(request))
                .build();
    }

    /**
     * Lấy chapter theo ID
     * @param id ID của chapter
     * @return Thông tin chapter
     */
    @GetMapping("/{id}")
    ApiResponse<ChapterResponse> getChapterById(@PathVariable String id) {
        return ApiResponse.<ChapterResponse>builder()
                .message("Chapter retrieved successfully")
                .result(chapterService.getChapterById(id))
                .build();
    }

    /**
     * Lấy tất cả chapter
     * @return Danh sách tất cả chapter
     */
    @GetMapping()
    ApiResponse<List<ChapterResponse>> getAllChapters() {
        return ApiResponse.<List<ChapterResponse>>builder()
                .message("Chapters retrieved successfully")
                .result(chapterService.getAllChapters())
                .build();
    }

    /**
     * Lấy danh sách chapter của một manga
     * @param mangaId ID của manga
     * @return Danh sách chapter của manga
     */
    @GetMapping("/manga/{mangaId}")
    ApiResponse<List<ChapterResponse>> getChaptersByMangaId(
            @PathVariable String mangaId) {
        return ApiResponse.<List<ChapterResponse>>builder()
                .message("Chapters for manga retrieved successfully")
                .result(chapterService.getChaptersByMangaId(mangaId))
                .build();
    }
}
