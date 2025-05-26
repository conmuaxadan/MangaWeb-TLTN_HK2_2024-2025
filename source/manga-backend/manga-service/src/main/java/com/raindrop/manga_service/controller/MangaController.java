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
import org.springframework.web.bind.annotation.*;

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
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
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
    ApiResponse<Page<MangaManagementResponse>> getAllMangas(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "genreName", required = false) String genreName,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "yearOfRelease", required = false) Integer yearOfRelease,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        // Nếu có bất kỳ filter nào, sử dụng search and filter
        if (keyword != null || genreName != null || status != null || yearOfRelease != null) {
            return ApiResponse.<Page<MangaManagementResponse>>builder()
                    .message("Filtered mangas retrieved successfully")
                    .result(mangaService.searchAndFilterActiveMangas(keyword, genreName, status, yearOfRelease, pageable))
                    .build();
        }

        // Nếu không có filter, sử dụng method cũ
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
        // Nếu có bất kỳ filter nào, sử dụng search and filter
        if (keyword != null || genreName != null || status != null || yearOfRelease != null) {
            return ApiResponse.<Page<MangaManagementResponse>>builder()
                    .message("Filtered deleted mangas retrieved successfully")
                    .result(mangaService.searchAndFilterDeletedMangas(keyword, genreName, status, yearOfRelease, pageable))
                    .build();
        }

        // Nếu không có filter, sử dụng method cũ
        return ApiResponse.<Page<MangaManagementResponse>>builder()
                .message("Deleted mangas retrieved successfully")
                .result(mangaService.getAllDeletedMangas(pageable))
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
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
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

    /**
     * Xóa mềm manga
     * @param id ID của manga cần xóa
     * @param jwt JWT token của người dùng
     * @return Thông báo xóa thành công
     */
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

    /**
     * Lấy danh sách manga đã bị xóa
     * @param pageable Thông tin phân trang
     * @return Danh sách manga đã bị xóa
     */
    @GetMapping("/deleted")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<Page<MangaResponse>> getDeletedMangas(Pageable pageable) {
        return ApiResponse.<Page<MangaResponse>>builder()
                .message("Deleted mangas retrieved successfully")
                .result(mangaService.getAllDeletedMangasPaginated(pageable))
                .build();
    }

    /**
     * Khôi phục manga đã xóa
     * @param id ID của manga cần khôi phục
     * @return Thông tin manga đã khôi phục
     */
    @PostMapping("/{id}/restore")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<MangaResponse> restoreManga(@PathVariable String id) {
        return ApiResponse.<MangaResponse>builder()
                .message("Manga restored successfully")
                .result(mangaService.restoreManga(id))
                .build();
    }

    /**
     * Tìm kiếm nâng cao manga
     * @param searchRequest Yêu cầu tìm kiếm nâng cao
     * @param pageable Thông tin phân trang
     * @return Danh sách manga phù hợp với điều kiện tìm kiếm
     */
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

    /**
     * Tìm kiếm manga theo từ khóa
     * @param keyword Từ khóa tìm kiếm
     * @param pageable Thông tin phân trang
     * @return Danh sách manga phù hợp với từ khóa
     */
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

    /**
     * Endpoint dành riêng cho việc tìm kiếm truyện khi thêm chapter
     * Trả về danh sách truyện ngắn gọn với các thông tin cần thiết
     * @param keyword Từ khóa tìm kiếm (tên truyện)
     * @return Danh sách truyện phù hợp với từ khóa
     */
    @GetMapping("/search/quick")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<List<MangaQuickSearchResponse>> quickSearchManga(
            @RequestParam String keyword,
            @RequestParam(required = false, defaultValue = "10") int limit
    ) {
        log.info("Quick searching manga with keyword: {}, limit: {}", keyword, limit);
        return ApiResponse.<List<MangaQuickSearchResponse>>builder()
                .message("Quick search results retrieved successfully")
                .result(mangaService.quickSearchManga(keyword, limit))
                .build();
    }

    /**
     * Tìm kiếm manga theo thể loại
     * @param genreName Tên thể loại
     * @param pageable Thông tin phân trang
     * @return Danh sách manga thuộc thể loại
     */
    @GetMapping("/genre/{genreName}")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<Page<MangaResponse>> findByGenre(
            @PathVariable String genreName,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ApiResponse.<Page<MangaResponse>>builder()
                .message("Mangas by genre retrieved successfully")
                .result(mangaService.findByGenre(genreName, pageable))
                .build();
    }

    /**
     * Lấy số chapter cao nhất của một truyện
     * @param id ID của truyện
     * @return Số chapter cao nhất
     */
    @GetMapping("/{id}/highest-chapter-number")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<Double> getHighestChapterNumber(@PathVariable String id) {
        return ApiResponse.<Double>builder()
                .message("Highest chapter number retrieved successfully")
                .result(mangaService.getHighestChapterNumber(id))
                .build();
    }

    /**
     * Đếm tổng số truyện trong hệ thống
     * @param includeDeleted Có bao gồm truyện đã xóa hay không (mặc định là false)
     * @return Tổng số truyện
     */
    @GetMapping("/count")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<Long> countMangas(@RequestParam(required = false, defaultValue = "false") boolean includeDeleted) {
        return ApiResponse.<Long>builder()
                .message("Manga count retrieved successfully")
                .result(mangaService.countMangas(includeDeleted))
                .build();
    }

    /**
     * Lấy thống kê tổng hợp về truyện
     * @return Thống kê tổng hợp về truyện
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAuthority('SYSTEM_MANAGEMENT')")
    ApiResponse<MangaStatisticsResponse> getMangaStatistics() {
        return ApiResponse.<MangaStatisticsResponse>builder()
                .message("Manga statistics retrieved successfully")
                .result(mangaService.getMangaStatistics())
                .build();
    }
}
