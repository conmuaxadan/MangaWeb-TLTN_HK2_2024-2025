package com.raindrop.manga_service.controller;

import com.raindrop.manga_service.dto.request.ChapterRequest;
import com.raindrop.manga_service.dto.request.MangaRequest;
import com.raindrop.manga_service.dto.request.ViewLogRequest;
import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.ChapterInfoResponse;
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
     * Tăng lượt xem của chapter (phương thức cũ, giữ lại để tương thích ngược)
     * @param id ID của chapter
     * @param request Thông tin lượt xem
     * @return Thông tin chapter sau khi cập nhật lượt xem
     */
    @PostMapping("/{id}/views")
    ApiResponse<ChapterResponse> logChapterView(
            @PathVariable String id,
            @RequestBody @Valid ViewLogRequest request) {

        // Kiểm tra xem chapterId trong request có khớp với id trong path không
        if (!id.equals(request.getChapterId())) {
            request = ViewLogRequest.builder()
                    .chapterId(id)
                    .userId(request.getUserId())
                    .sessionId(request.getSessionId())
                    .scrollPercentage(request.getScrollPercentage())
                    .build();
        }
        // Lấy thông tin chapter sau khi cập nhật lượt xem
        ChapterResponse chapterResponse = chapterService.getChapterById(id);

        return ApiResponse.<ChapterResponse>builder()
                .message("Chapter view logged successfully")
                .result(chapterResponse)
                .build();
    }

    /**
     * Tăng lượt xem của chapter (phương thức đơn giản hóa)
     * @param id ID của chapter
     * @return Thông tin chapter sau khi cập nhật lượt xem
     */
    @PostMapping("/{id}/views/increment")
    ApiResponse<ChapterResponse> incrementChapterView(@PathVariable String id) {
        log.info("Simple view increment for chapter: {}", id);

        // Tăng lượt xem và lấy thông tin chapter sau khi cập nhật
        ChapterResponse chapterResponse = chapterService.incrementChapterViews(id);

        return ApiResponse.<ChapterResponse>builder()
                .message("Chapter view incremented successfully")
                .result(chapterResponse)
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
