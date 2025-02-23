package com.raindrop.manga_service.service;

import com.raindrop.manga_service.dto.request.ChapterRequest;
import com.raindrop.manga_service.dto.response.ChapterResponse;
import com.raindrop.manga_service.mapper.ChapterMapper;
import com.raindrop.manga_service.repository.ChapterRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class ChapterService {
    ChapterRepository chapterRepository;
    ChapterMapper chapterMapper;

    public ChapterResponse createChapter(ChapterRequest request) {
        var chapter = chapterMapper.toChapter(request);
        chapterRepository.save(chapter);

        return chapterMapper.toChapterResponse(chapter);
    }

}
