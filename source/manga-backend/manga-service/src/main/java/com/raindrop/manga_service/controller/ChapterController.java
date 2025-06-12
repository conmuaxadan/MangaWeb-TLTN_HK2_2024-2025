package com.raindrop.manga_service.controller;

import com.raindrop.manga_service.dto.request.ChapterRequest;
import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.ChapterInfoResponse;
import com.raindrop.manga_service.dto.response.ChapterResponse;
import com.raindrop.manga_service.service.ChapterService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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
    @PreAuthorize("hasAnyAuthority('MANGA_MANAGEMENT', 'TRANSLATOR_MANAGEMENT')")
    ApiResponse<ChapterResponse> createChapter(
            @RequestParam("chapterNumber") String chapterNumber,
            @RequestParam("mangaId") String mangaId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam("pages") List<MultipartFile> pages
    ) {
        ChapterRequest request = ChapterRequest.builder()
                .chapterNumber(Double.parseDouble(chapterNumber))
                .title(title != null && !title.isEmpty() ? title : "Chương " + chapterNumber)
                .mangaId(mangaId)
                .pages(pages)
                .build();


        return ApiResponse.<ChapterResponse>builder()
                .code(201)
                .message("Chapter created successfully")
                .result(chapterService.createChapter(request))
                .build();
    }


    @GetMapping("/{id}")
    ApiResponse<ChapterResponse> getChapterById(@PathVariable String id) {
        return ApiResponse.<ChapterResponse>builder()
                .message("Chapter retrieved successfully")
                .result(chapterService.getChapterById(id))
                .build();
    }

    @GetMapping()
    ApiResponse<Page<ChapterResponse>> getAllChapters(
            @RequestParam(value = "mangaId", required = false) String mangaId,
            Pageable pageable) {

        if (mangaId != null && !mangaId.trim().isEmpty()) {
            return ApiResponse.<Page<ChapterResponse>>builder()
                    .message("Filtered chapters retrieved successfully")
                    .result(chapterService.searchAndFilterChapters(mangaId, pageable))
                    .build();
        }

        return ApiResponse.<Page<ChapterResponse>>builder()
                .message("Chapters retrieved successfully")
                .result(chapterService.getAllChapters(pageable))
                .build();
    }


    @GetMapping("/manga/{mangaId}")
    ApiResponse<List<ChapterResponse>> getChaptersByMangaId(
            @PathVariable String mangaId) {
        return ApiResponse.<List<ChapterResponse>>builder()
                .message("Chapters for manga retrieved successfully")
                .result(chapterService.getChaptersByMangaId(mangaId))
                .build();
    }


    @GetMapping("/byManga/{mangaId}")
    ApiResponse<List<ChapterResponse>> getChaptersByMangaIdRest(
            @PathVariable String mangaId) {
        return ApiResponse.<List<ChapterResponse>>builder()
                .message("Chapters for manga retrieved successfully")
                .result(chapterService.getChaptersByMangaId(mangaId))
                .build();
    }

    @GetMapping("/manga/{mangaId}/paginated")
    ApiResponse<Page<ChapterResponse>> getChaptersByMangaIdPaginated(
            @PathVariable String mangaId,
            @PageableDefault(size = 10, sort = "chapterNumber", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.<Page<ChapterResponse>>builder()
                .message("Paginated chapters for manga retrieved successfully")
                .result(chapterService.getChaptersByMangaIdPaginated(mangaId, pageable))
                .build();
    }


    @GetMapping("/{id}/info")
    ApiResponse<ChapterInfoResponse> getChapterInfo(@PathVariable String id) {
        return ApiResponse.<ChapterInfoResponse>builder()
                .message("Chapter info retrieved successfully")
                .result(chapterService.getChapterInfo(id))
                .build();
    }


    @GetMapping("/my-chapters")
    @PreAuthorize("hasAuthority('TRANSLATOR_MANAGEMENT')")
    ApiResponse<Page<ChapterResponse>> getMyChapters(
            @RequestParam(value = "keyword", required = false) String keyword,
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        return ApiResponse.<Page<ChapterResponse>>builder()
                .message("My chapters retrieved successfully")
                .result(chapterService.getChaptersByCreatedBy(userId, keyword, pageable))
                .build();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('MANGA_MANAGEMENT', 'TRANSLATOR_MANAGEMENT')")
    ApiResponse<ChapterResponse> updateChapter(
            @PathVariable String id,
            @RequestParam(value = "title", required = false, defaultValue = "") String title,
            @RequestParam(value = "chapterNumber", required = false) String chapterNumber,
            @RequestParam(value = "pages", required = false) List<MultipartFile> pages
    ) {
        ChapterRequest request = ChapterRequest.builder()
                .title(title)
                .chapterNumber(chapterNumber != null && !chapterNumber.isEmpty() ? Double.parseDouble(chapterNumber) : 0)
                .pages(pages)
                .build();


        return ApiResponse.<ChapterResponse>builder()
                .message("Chapter updated successfully")
                .result(chapterService.updateChapter(id, request))
                .build();
    }


    @PutMapping(value = "/{id}/pages/{pageIndex}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('MANGA_MANAGEMENT', 'TRANSLATOR_MANAGEMENT')")
    ApiResponse<ChapterResponse> updateChapterPage(
            @PathVariable String id,
            @PathVariable int pageIndex,
            @RequestParam("page") MultipartFile page
    ) {


        return ApiResponse.<ChapterResponse>builder()
                .message("Chapter page updated successfully")
                .result(chapterService.updateChapterPage(id, pageIndex, page))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('MANGA_MANAGEMENT', 'TRANSLATOR_MANAGEMENT')")
    ApiResponse<Void> deleteChapter(@PathVariable String id) {
        chapterService.deleteChapter(id);
        return ApiResponse.<Void>builder()
                .message("Chapter deleted successfully")
                .build();
    }

    @DeleteMapping("/{id}/pages/{pageIndex}")
    @PreAuthorize("hasAnyAuthority('MANGA_MANAGEMENT', 'TRANSLATOR_MANAGEMENT')")
    ApiResponse<ChapterResponse> deleteChapterPage(
            @PathVariable String id,
            @PathVariable int pageIndex
    ) {
        return ApiResponse.<ChapterResponse>builder()
                .message("Chapter page deleted successfully")
                .result(chapterService.deleteChapterPage(id, pageIndex))
                .build();
    }
}
