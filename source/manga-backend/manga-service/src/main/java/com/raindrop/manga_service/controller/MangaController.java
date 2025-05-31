package com.raindrop.manga_service.controller;

import com.raindrop.manga_service.dto.request.AdvancedSearchRequest;
import com.raindrop.manga_service.dto.request.MangaRequest;
import com.raindrop.manga_service.dto.response.*;
import com.raindrop.manga_service.enums.MangaStatus;
import com.raindrop.manga_service.service.MangaService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/mangas")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class MangaController {
    MangaService mangaService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('MANGA_MANAGEMENT', 'TRANSLATOR_MANAGEMENT')")
    ApiResponse<MangaResponse> createManga(
            @RequestParam("title") String title,
            @RequestParam("author") String author,
            @RequestParam("description") String description,
            @RequestParam("genres") String genresString,
            @RequestParam("cover") MultipartFile cover,
            @RequestParam("yearOfRelease") int yearOfRelease,
            @RequestParam("status") String statusStr
    ) {
        Set<String> genres = Arrays.stream(genresString.split(","))
                .map(String::trim)
                .collect(Collectors.toSet());

        MangaStatus status;
        try {
            status = MangaStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            status = MangaStatus.ONGOING;
        }

        MangaRequest request = MangaRequest.builder()
                .title(title)
                .author(author)
                .description(description)
                .genres(genres)
                .cover(cover)
                .yearOfRelease(yearOfRelease)
                .status(status)
                .build();

        return ApiResponse.<MangaResponse>builder()
                .code(201)
                .message("Manga created successfully")
                .result(mangaService.createManga(request))
                .build();
    }


    @GetMapping("/{id}")
    ApiResponse<MangaResponse> getMangaById(@PathVariable String id) {
        return ApiResponse.<MangaResponse>builder()
                .message("Manga retrieved successfully")
                .result(mangaService.getMangaById(id))
                .build();
    }

    @GetMapping()
    @PreAuthorize("hasAnyAuthority('MANGA_MANAGEMENT')")
    ApiResponse<Page<MangaManagementResponse>> getAllMangas(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "genreName", required = false) String genreName,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "yearOfRelease", required = false) Integer yearOfRelease,
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal Jwt jwt
    ) {
        // Nếu có quyền MANGA_MANAGEMENT hoặc SYSTEM_MANAGEMENT, xem tất cả truyện
        if (keyword != null || genreName != null || status != null || yearOfRelease != null) {
            return ApiResponse.<Page<MangaManagementResponse>>builder()
                    .message("Filtered mangas retrieved successfully")
                    .result(mangaService.searchAndFilterActiveMangas(keyword, genreName, status, yearOfRelease, pageable))
                    .build();
        }

        return ApiResponse.<Page<MangaManagementResponse>>builder()
                .message("Mangas retrieved successfully")
                .result(mangaService.getAllMangas(pageable))
                .build();
    }

    @GetMapping("/management/deleted")
    ApiResponse<Page<MangaManagementResponse>> getAllDeletedMangas(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "genreName", required = false) String genreName,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "yearOfRelease", required = false) Integer yearOfRelease,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        if (keyword != null || genreName != null || status != null || yearOfRelease != null) {
            return ApiResponse.<Page<MangaManagementResponse>>builder()
                    .message("Filtered deleted mangas retrieved successfully")
                    .result(mangaService.searchAndFilterDeletedMangas(keyword, genreName, status, yearOfRelease, pageable))
                    .build();
        }

        return ApiResponse.<Page<MangaManagementResponse>>builder()
                .message("Deleted mangas retrieved successfully")
                .result(mangaService.getAllDeletedMangas(pageable))
                .build();
    }


    @GetMapping("/summaries")
    ApiResponse<Page<MangaSummaryResponse>> getMangaSummaries(Pageable pageable) {
        return ApiResponse.<Page<MangaSummaryResponse>>builder()
                .message("Manga summaries retrieved successfully")
                .result(mangaService.getMangaSummariesPaginated(pageable))
                .build();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('MANGA_MANAGEMENT', 'TRANSLATOR_MANAGEMENT')")
    ApiResponse<MangaResponse> updateManga(
            @PathVariable String id,
            @RequestParam("title") String title,
            @RequestParam("author") String author,
            @RequestParam("description") String description,
            @RequestParam("genres") Set<String> genres,
            @RequestParam(value = "cover", required = false) MultipartFile cover,
            @RequestParam(value = "yearOfRelease", required = false, defaultValue = "0") int yearOfRelease,
            @RequestParam(value = "status", required = false) String statusStr
    ) {
        MangaStatus status = null;
        if (statusStr != null && !statusStr.isEmpty()) {
            try {
                status = MangaStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, keep null
            }
        }

        MangaRequest request = MangaRequest.builder()
                .title(title)
                .author(author)
                .description(description)
                .genres(genres)
                .cover(cover)
                .yearOfRelease(yearOfRelease)
                .status(status)
                .build();

        return ApiResponse.<MangaResponse>builder()
                .message("Manga updated successfully")
                .result(mangaService.updateManga(id, request))
                .build();
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<Void> deleteManga(
            @PathVariable String id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt
    ) {
        String userId = jwt.getSubject();
        mangaService.deleteManga(id, userId);
        return ApiResponse.<Void>builder()
                .message("Manga deleted successfully")
                .build();
    }


    @GetMapping("/deleted")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<Page<MangaResponse>> getDeletedMangas(Pageable pageable) {
        return ApiResponse.<Page<MangaResponse>>builder()
                .message("Deleted mangas retrieved successfully")
                .result(mangaService.getAllDeletedMangasPaginated(pageable))
                .build();
    }


    @PostMapping("/{id}/restore")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<MangaResponse> restoreManga(@PathVariable String id) {
        return ApiResponse.<MangaResponse>builder()
                .message("Manga restored successfully")
                .result(mangaService.restoreManga(id))
                .build();
    }


    @PostMapping("/search/advanced")
    ApiResponse<Page<MangaResponse>> advancedSearch(
            @RequestBody AdvancedSearchRequest searchRequest,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ApiResponse.<Page<MangaResponse>>builder()
                .message("Advanced search results retrieved successfully")
                .result(mangaService.advancedSearch(searchRequest, pageable))
                .build();
    }


    @GetMapping("/search")
    ApiResponse<Page<MangaResponse>> searchByKeyword(
            @RequestParam String keyword,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ApiResponse.<Page<MangaResponse>>builder()
                .message("Search results retrieved successfully")
                .result(mangaService.searchByKeyword(keyword, pageable))
                .build();
    }

    @GetMapping("/my-mangas")
    @PreAuthorize("hasAuthority('TRANSLATOR_MANAGEMENT')")
    ApiResponse<Page<MangaManagementResponse>> getMyMangas(
            @RequestParam(value = "keyword", required = false) String keyword,
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        return ApiResponse.<Page<MangaManagementResponse>>builder()
                .message("My mangas retrieved successfully")
                .result(mangaService.searchAndFilterMangasByCreatedBy(keyword, null, null, null, userId, pageable))
                .build();
    }

    @GetMapping("/search/quick")
    @PreAuthorize("hasAnyAuthority('MANGA_MANAGEMENT', 'TRANSLATOR_MANAGEMENT')")
    ApiResponse<List<MangaQuickSearchResponse>> quickSearchManga(
            @RequestParam String keyword,
            @RequestParam(required = false, defaultValue = "10") int limit,
            @AuthenticationPrincipal Jwt jwt
    ) {
        // Lấy thông tin người dùng và quyền
        String userId = jwt.getSubject();
        Collection<String> authorities = jwt.getClaimAsStringList("scope");

        boolean hasTranslatorManagement = authorities.stream().anyMatch(auth -> auth.contains("TRANSLATOR_MANAGEMENT"));
        boolean hasMangaManagement = authorities.stream().anyMatch(auth -> auth.contains("MANGA_MANAGEMENT"));
        boolean hasSystemManagement = authorities.stream().anyMatch(auth -> auth.contains("SYSTEM_MANAGEMENT"));

        // Nếu chỉ có quyền TRANSLATOR_MANAGEMENT, chỉ tìm trong truyện của họ
        if (hasTranslatorManagement && !hasMangaManagement && !hasSystemManagement) {
            return ApiResponse.<List<MangaQuickSearchResponse>>builder()
                    .message("Quick search results retrieved successfully")
                    .result(mangaService.quickSearchMangaByCreatedBy(keyword, limit, userId))
                    .build();
        }

        // Admin hoặc manga manager - tìm tất cả
        return ApiResponse.<List<MangaQuickSearchResponse>>builder()
                .message("Quick search results retrieved successfully")
                .result(mangaService.quickSearchManga(keyword, limit))
                .build();
    }


    @GetMapping("/genre/{genreName}")
    ApiResponse<Page<MangaSummaryResponse>> findByGenre(
            @PathVariable String genreName,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ApiResponse.<Page<MangaSummaryResponse>>builder()
                .message("Mangas by genre retrieved successfully")
                .result(mangaService.findByGenre(genreName, pageable))
                .build();
    }


    @GetMapping("/{id}/highest-chapter-number")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<Double> getHighestChapterNumber(@PathVariable String id) {
        return ApiResponse.<Double>builder()
                .message("Highest chapter number retrieved successfully")
                .result(mangaService.getHighestChapterNumber(id))
                .build();
    }


    @GetMapping("/count")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<Long> countMangas(@RequestParam(required = false, defaultValue = "false") boolean includeDeleted) {
        return ApiResponse.<Long>builder()
                .message("Manga count retrieved successfully")
                .result(mangaService.countMangas(includeDeleted))
                .build();
    }


    @GetMapping("/statistics")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<MangaStatisticsResponse> getMangaStatistics() {
        return ApiResponse.<MangaStatisticsResponse>builder()
                .message("Manga statistics retrieved successfully")
                .result(mangaService.getMangaStatistics())
                .build();
    }
}
