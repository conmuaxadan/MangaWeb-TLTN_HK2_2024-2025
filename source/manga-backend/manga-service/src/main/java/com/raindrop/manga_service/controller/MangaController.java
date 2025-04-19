package com.raindrop.manga_service.controller;

import com.raindrop.manga_service.dto.request.AdvancedSearchRequest;
import com.raindrop.manga_service.dto.request.MangaRequest;
import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.MangaResponse;
import com.raindrop.manga_service.dto.response.MangaSummaryResponse;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
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
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
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

        // Chuyển đổi String status thành enum MangaStatus
        MangaStatus status;
        try {
            status = MangaStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Nếu không chuyển đổi được, sử dụng giá trị mặc định ONGOING
            log.warn("Invalid status value: {}, using default ONGOING", statusStr);
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
    ApiResponse<List<MangaResponse>> getAllMangas() {
        return ApiResponse.<List<MangaResponse>>builder()
                .message("Mangas retrieved successfully")
                .result(mangaService.getAllMangas())
                .build();
    }

    /**
     * Lấy danh sách manga có phân trang
     * @param pageable Thông tin phân trang
     * @return Danh sách manga có phân trang
     */
    @GetMapping("/paginated")
    ApiResponse<Page<MangaResponse>> getAllMangasPaginated(Pageable pageable) {
        return ApiResponse.<Page<MangaResponse>>builder()
                .message("Paginated mangas retrieved successfully")
                .result(mangaService.getAllMangasPaginated(pageable))
                .build();
    }

    /**
     * Lấy danh sách tóm tắt manga có phân trang
     * @param pageable Thông tin phân trang
     * @return Danh sách tóm tắt manga có phân trang
     */
    @GetMapping("/summaries")
    ApiResponse<Page<MangaSummaryResponse>> getMangaSummaries(Pageable pageable) {
        return ApiResponse.<Page<MangaSummaryResponse>>builder()
                .message("Manga summaries retrieved successfully")
                .result(mangaService.getMangaSummariesPaginated(pageable))
                .build();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
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
        // Chuyển đổi String status thành enum MangaStatus nếu có
        MangaStatus status = null;
        if (statusStr != null && !statusStr.isEmpty()) {
            try {
                status = MangaStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status value: {}, using null", statusStr);
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
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    ApiResponse<Void> deleteManga(@PathVariable String id) {
        mangaService.deleteManga(id);
        return ApiResponse.<Void>builder()
                .message("Manga deleted successfully")
                .build();
    }

    /**
     * Tìm kiếm nâng cao manga
     * @param searchRequest Yêu cầu tìm kiếm nâng cao
     * @param pageable Thông tin phân trang
     * @return Danh sách manga phù hợp với điều kiện tìm kiếm
     */
    @PostMapping("/advanced-search")
    ApiResponse<Page<MangaResponse>> advancedSearch(
            @RequestBody AdvancedSearchRequest searchRequest,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ApiResponse.<Page<MangaResponse>>builder()
                .message("Advanced search results retrieved successfully")
                .result(mangaService.advancedSearch(searchRequest, pageable))
                .build();
    }
}
