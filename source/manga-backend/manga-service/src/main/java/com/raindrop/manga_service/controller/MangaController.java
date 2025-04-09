package com.raindrop.manga_service.controller;

import com.raindrop.manga_service.dto.request.MangaRequest;
import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.MangaResponse;
import com.raindrop.manga_service.service.MangaService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mangas")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class MangaController {
    MangaService mangaService;

    @PostMapping()
    ApiResponse<MangaResponse> createManga(@RequestBody @Valid MangaRequest request) {
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

    @PutMapping("/{id}")
    ApiResponse<MangaResponse> updateManga(@PathVariable String id, @RequestBody MangaRequest request) {
        return ApiResponse.<MangaResponse>builder()
                .message("Manga updated successfully")
                .result(mangaService.updateManga(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    ApiResponse<Void> deleteManga(@PathVariable String id) {
        mangaService.deleteManga(id);
        return ApiResponse.<Void>builder()
                .message("Manga deleted successfully")
                .build();
    }
}
