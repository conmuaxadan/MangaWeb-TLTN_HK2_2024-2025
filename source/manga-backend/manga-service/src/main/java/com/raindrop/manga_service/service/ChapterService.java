package com.raindrop.manga_service.service;

import com.raindrop.manga_service.dto.request.ChapterRequest;
import com.raindrop.manga_service.dto.response.ApiResponse;
import com.raindrop.manga_service.dto.response.ChapterResponse;
import com.raindrop.manga_service.dto.response.FileDataResponse;
import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.mapper.ChapterMapper;
import com.raindrop.manga_service.repository.ChapterRepository;
import com.raindrop.manga_service.repository.MangaRepository;
import com.raindrop.manga_service.repository.httpclient.UploadClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class ChapterService {
    ChapterRepository chapterRepository;
    ChapterMapper chapterMapper;
    UploadClient uploadClient;
    MangaRepository mangaRepository;

    public ChapterResponse createChapter(ChapterRequest request) {
        if (request.getPages() == null || request.getPages().isEmpty()) {
            throw new IllegalArgumentException("Chapter must have at least one page");
        }

        List<String> fileUrls = new ArrayList<>();
        for (int i = 0; i < request.getPages().size(); i++) {
            MultipartFile file = request.getPages().get(i);
            try {
                ApiResponse<FileDataResponse> apiResponse = uploadClient.uploadMedia(file);
                fileUrls.add(apiResponse.getResult().getUrl());
            } catch (Exception e) {
                log.error("Error uploading file [{}]: {}", i, e.getMessage());
                throw new RuntimeException("Failed to upload all images");
            }
        }

        Chapter chapter = Chapter.builder()
                .chapterNumber(request.getChapterNumber())
                .title(request.getTitle())
                .manga(mangaRepository.findById(request.getMangaId())
                        .orElseThrow(() -> new RuntimeException("Manga not found")))
                .pages(fileUrls) // Lưu danh sách URL ảnh
                .build();

        chapterRepository.save(chapter);

        return ChapterResponse.builder()
                .chapterNumber(chapter.getChapterNumber())
                .title(chapter.getTitle())
                .mangaId(chapter.getManga().getId())
                .pages(chapter.getPages())
                .build();
    }


}
