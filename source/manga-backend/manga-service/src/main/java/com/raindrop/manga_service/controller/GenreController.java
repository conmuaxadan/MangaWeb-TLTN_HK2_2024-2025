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
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<GenreResponse> createGenre(@RequestBody @Valid GenreRequest request) {
        return ApiResponse.<GenreResponse>builder()
                .code(201)
                .message("Genre created successfully")
                .result(genreService.createGenre(request))
                .build();
    }

    @GetMapping("/{id}")
    ApiResponse<GenreResponse> getGenreById(@PathVariable Long id) {
        return ApiResponse.<GenreResponse>builder()
                .message("Genre retrieved successfully")
                .result(genreService.getGenreById(id))
                .build();
    }

    @GetMapping("/name/{name}")
    ApiResponse<GenreResponse> getGenreByName(@PathVariable String name) {
        return ApiResponse.<GenreResponse>builder()
                .message("Genre retrieved successfully")
                .result(genreService.getGenreByName(name))
                .build();
    }

    @GetMapping()
    ApiResponse<List<GenreResponse>> getAllGenres() {
        List<GenreResponse> genres = genreService.getAllGenres();
        log.info("Returning {} genres to client", genres.size());
        for (GenreResponse genre : genres) {
            log.info("Controller - GenreResponse: id={} ({}), name={}, description={}",
                    genre.getId(), genre.getId() != null ? genre.getId().getClass().getSimpleName() : "null",
                    genre.getName(), genre.getDescription());
        }

        return ApiResponse.<List<GenreResponse>>builder()
                .message("Genres retrieved successfully")
                .result(genres)
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<GenreResponse> updateGenreById(@PathVariable Long id, @RequestBody GenreRequest request) {
        return ApiResponse.<GenreResponse>builder()
                .message("Genre updated successfully")
                .result(genreService.updateGenreById(id, request))
                .build();
    }

    @PutMapping("/name/{name}")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<GenreResponse> updateGenreByName(@PathVariable String name, @RequestBody GenreRequest request) {
        return ApiResponse.<GenreResponse>builder()
                .message("Genre updated successfully")
                .result(genreService.updateGenreByName(name, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<Void> deleteGenreById(@PathVariable Long id) {
        genreService.deleteGenreById(id);
        return ApiResponse.<Void>builder()
                .message("Genre deleted successfully")
                .build();
    }

    @DeleteMapping("/name/{name}")
    @PreAuthorize("hasAuthority('MANGA_MANAGEMENT')")
    ApiResponse<Void> deleteGenreByName(@PathVariable String name) {
        genreService.deleteGenreByName(name);
        return ApiResponse.<Void>builder()
                .message("Genre deleted successfully")
                .build();
    }
}
