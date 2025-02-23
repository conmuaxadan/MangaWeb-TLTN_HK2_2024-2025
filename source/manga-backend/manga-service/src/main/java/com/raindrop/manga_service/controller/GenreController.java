package com.raindrop.manga_service.controller;

import com.raindrop.manga_service.dto.request.GenreRequest;
import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.GenreResponse;
import com.raindrop.manga_service.service.GenreService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/genres")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class GenreController {
    GenreService genreService;

    @PostMapping()
    ApiResponse<GenreResponse> createGenre(@RequestBody @Valid GenreRequest request) {
        return ApiResponse.<GenreResponse>builder()
                .message("Genre created successfully")
                .result(genreService.createGenre(request))
                .build();
    }

    @GetMapping("/{name}")
    ApiResponse<GenreResponse> getGenre(@PathVariable String name) {
        return ApiResponse.<GenreResponse>builder()
                .message("Genre retrieved successfully")
                .result(genreService.getGenre(name))
                .build();
    }

    @GetMapping("/all")
    ApiResponse<List<GenreResponse>> getAllGenres() {
        return ApiResponse.<List<GenreResponse>>builder()
                .message("Genres retrieved successfully")
                .result(genreService.getAllGenres())
                .build();
    }

    @PutMapping("/{name}")
    ApiResponse<GenreResponse> updateGenre(@PathVariable String name, @RequestBody GenreRequest request) {
        return ApiResponse.<GenreResponse>builder()
                .message("Genre updated successfully")
                .result(genreService.updateGenre(name, request))
                .build();
    }

    @DeleteMapping("/{name}")
    ApiResponse<Void> deleteGenre(@PathVariable String name) {
        genreService.deleteGenre(name);
        return ApiResponse.<Void>builder()
                .message("Genre deleted successfully")
                .build();
    }
}
