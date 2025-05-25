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
            @RequestParam(value = "title", required = false) String title,
            @RequestParam("pages") List<MultipartFile> pages
    ) {
        ChapterRequest request = ChapterRequest.builder()
                .chapterNumber(Double.parseDouble(chapterNumber))
                .title(title != null && !title.isEmpty() ? title : "Chương " + chapterNumber)
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
     * Lấy tất cả chapter với khả năng lọc
     * @param mangaId ID của manga để lọc (optional)
     * @param pageable Thông tin phân trang
     * @return Danh sách chapter
     */
    @GetMapping()
    ApiResponse<Page<ChapterResponse>> getAllChapters(
            @RequestParam(value = "mangaId", required = false) String mangaId,
            Pageable pageable) {

        log.info("getAllChapters called with mangaId: {}, pageable: {}", mangaId, pageable);

        // Nếu có mangaId filter, sử dụng search and filter
        if (mangaId != null && !mangaId.trim().isEmpty()) {
            log.info("Using filtered search with mangaId: {}", mangaId);
            return ApiResponse.<Page<ChapterResponse>>builder()
                    .message("Filtered chapters retrieved successfully")
                    .result(chapterService.searchAndFilterChapters(mangaId, pageable))
                    .build();
        }

        // Nếu không có filter, sử dụng method cũ
        log.info("Using non-filtered search");
        return ApiResponse.<Page<ChapterResponse>>builder()
                .message("Chapters retrieved successfully")
                .result(chapterService.getAllChapters(pageable))
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

    /**
     * Phương thức mới để lấy danh sách chapter của một manga theo chuẩn REST
     * @param mangaId ID của manga
     * @return Danh sách chapter của manga
     */
    @GetMapping("/byManga/{mangaId}")
    ApiResponse<List<ChapterResponse>> getChaptersByMangaIdRest(
            @PathVariable String mangaId) {
        return ApiResponse.<List<ChapterResponse>>builder()
                .message("Chapters for manga retrieved successfully")
                .result(chapterService.getChaptersByMangaId(mangaId))
                .build();
    }

    /**
     * Lấy thông tin cơ bản của chapter
     * @param id ID của chapter
     * @return Thông tin cơ bản của chapter
     */
    @GetMapping("/{id}/info")
    ApiResponse<ChapterInfoResponse> getChapterInfo(@PathVariable String id) {
        return ApiResponse.<ChapterInfoResponse>builder()
                .message("Chapter info retrieved successfully")
                .result(chapterService.getChapterInfo(id))
                .build();
    }

    /**
     * Cập nhật chapter
     * @param id ID của chapter
     * @param title Tiêu đề mới của chapter
     * @param pages Danh sách trang mới (nếu có)
     * @return Thông tin chapter sau khi cập nhật
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    ApiResponse<ChapterResponse> updateChapter(
            @PathVariable String id,
            @RequestParam(value = "title", required = false, defaultValue = "") String title,
            @RequestParam(value = "pages", required = false) List<MultipartFile> pages
    ) {
        ChapterRequest request = ChapterRequest.builder()
                .title(title)
                .pages(pages)
                .build();

        log.info("Update chapter request: {}", request);

        return ApiResponse.<ChapterResponse>builder()
                .message("Chapter updated successfully")
                .result(chapterService.updateChapter(id, request))
                .build();
    }

    /**
     * Cập nhật một trang cụ thể trong chapter
     * @param id ID của chapter
     * @param pageIndex Vị trí của trang cần cập nhật
     * @param page File ảnh mới
     * @return Thông tin chapter sau khi cập nhật
     */
    @PutMapping(value = "/{id}/pages/{pageIndex}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    ApiResponse<ChapterResponse> updateChapterPage(
            @PathVariable String id,
            @PathVariable int pageIndex,
            @RequestParam("page") MultipartFile page
    ) {
        log.info("Update chapter page request: chapterId={}, pageIndex={}", id, pageIndex);

        return ApiResponse.<ChapterResponse>builder()
                .message("Chapter page updated successfully")
                .result(chapterService.updateChapterPage(id, pageIndex, page))
                .build();
    }

    /**
     * Xóa một chapter
     * @param id ID của chapter cần xóa
     * @return Thông báo xác nhận xóa thành công
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    ApiResponse<Void> deleteChapter(@PathVariable String id) {
        log.info("Delete chapter request: id={}", id);
        chapterService.deleteChapter(id);
        return ApiResponse.<Void>builder()
                .message("Chapter deleted successfully")
                .build();
    }

    /**
     * Xóa một trang cụ thể trong chapter
     * @param id ID của chapter
     * @param pageIndex Vị trí của trang cần xóa
     * @return Thông tin chapter sau khi xóa trang
     */
    @DeleteMapping("/{id}/pages/{pageIndex}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    ApiResponse<ChapterResponse> deleteChapterPage(
            @PathVariable String id,
            @PathVariable int pageIndex
    ) {
        log.info("Delete chapter page request: chapterId={}, pageIndex={}", id, pageIndex);

        return ApiResponse.<ChapterResponse>builder()
                .message("Chapter page deleted successfully")
                .result(chapterService.deleteChapterPage(id, pageIndex))
                .build();
    }
}
