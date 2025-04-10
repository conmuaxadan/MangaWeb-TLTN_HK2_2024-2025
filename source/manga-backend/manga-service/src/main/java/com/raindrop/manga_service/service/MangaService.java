package com.raindrop.manga_service.service;

import com.raindrop.manga_service.dto.request.MangaRequest;
import com.raindrop.manga_service.dto.response.MangaResponse;
import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Genre;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.enums.ErrorCode;
import com.raindrop.event.MangaInfoEvent;
import com.raindrop.manga_service.exception.AppException;
import com.raindrop.manga_service.mapper.MangaMapper;
import com.raindrop.manga_service.repository.ChapterRepository;
import com.raindrop.manga_service.repository.GenreRepository;
import com.raindrop.manga_service.repository.MangaRepository;
import com.raindrop.manga_service.repository.PageRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class MangaService {
    MangaRepository mangaRepository;
    MangaMapper mangaMapper;
    GenreRepository genreRepository;
    ChapterRepository chapterRepository;
    PageRepository pageRepository;
    KafkaProducer kafkaProducer;

    public MangaResponse createManga(MangaRequest request) {
        // Kiểm tra xem manga đã tồn tại chưa
        Manga existingManga = mangaRepository.findByTitle(request.getTitle());
        if (existingManga != null) {
            throw new AppException(ErrorCode.MANGA_ALREADY_EXISTS);
        }

        var manga = mangaMapper.toManga(request);
        List<Genre> genres = new ArrayList<>();
        for (var genreName : request.getGenres()) {
            var genre = genreRepository.findByName(genreName);
            if (genre == null) {
                throw new AppException(ErrorCode.GENRE_NOT_FOUND);
            }
            genres.add(genre);
        }
        manga.setGenres(genres);
        manga = mangaRepository.save(manga);

        // Send manga info event to Kafka
        MangaInfoEvent mangaInfoEvent = MangaInfoEvent.builder()
                .mangaId(manga.getId())
                .title(manga.getTitle())
                .description(manga.getDescription())
                .author(manga.getAuthor())
                .coverUrl(manga.getCoverUrl())
                .build();
        kafkaProducer.sendMangaInfo(mangaInfoEvent);

        return mangaMapper.toMangaResponse(manga);
    }

    public MangaResponse getMangaByName(String title) {
        var manga = mangaRepository.findByTitle(title);
        if (manga == null) {
            throw new AppException(ErrorCode.MANGA_NOT_FOUND);
        }
        return mangaMapper.toMangaResponse(manga);
    }

    public MangaResponse getMangaById(String id) {
        Manga manga = mangaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));
        return MangaResponse.builder()
                .id(manga.getId())
                .title(manga.getTitle())
                .author(manga.getAuthor())
                .description(manga.getDescription())
                .loves(manga.getLoves())
                .views(manga.getViews())
                .genres(manga.getGenres().stream().map(Genre::getName).collect(Collectors.toList()))
                .chapters(manga.getChapters().stream().map(Chapter::getId).collect(Collectors.toList()))
                .updatedAt(manga.getUpdatedAt())
                .lastChapterAddedAt(manga.getLastChapterAddedAt())
                .build();
    }


    public List<MangaResponse> getAllMangas() {
        log.info("Getting all mangas");
        List<Manga> mangas = mangaRepository.findAll();
        log.info("Retrieved {} mangas", mangas.size());
        return mangas.stream().map(mangaMapper::toMangaResponse).toList();
    }

    /**
     * Lấy danh sách manga có phân trang
     * @param pageable Thông tin phân trang
     * @return Danh sách manga có phân trang
     */
    public Page<MangaResponse> getAllMangasPaginated(Pageable pageable) {
        log.info("Getting paginated mangas with page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Manga> mangasPage = mangaRepository.findAll(pageable);
        Page<MangaResponse> mangaResponsePage = mangasPage.map(mangaMapper::toMangaResponse);
        log.info("Retrieved {} mangas out of {} total", mangaResponsePage.getNumberOfElements(), mangaResponsePage.getTotalElements());
        return mangaResponsePage;
    }

    public void deleteManga(String id) {
        var manga = mangaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));
        mangaRepository.delete(manga);
    }

    public MangaResponse updateManga(String title, MangaRequest request) {
        var manga = mangaRepository.findByTitle(title);
        if (manga == null) {
            throw new AppException(ErrorCode.MANGA_NOT_FOUND);
        }

        // Kiểm tra xem title mới đã tồn tại chưa (nếu title thay đổi)
        if (!title.equals(request.getTitle())) {
            Manga existingManga = mangaRepository.findByTitle(request.getTitle());
            if (existingManga != null) {
                throw new AppException(ErrorCode.MANGA_ALREADY_EXISTS);
            }
        }

        manga.setTitle(request.getTitle());
        manga.setDescription(request.getDescription());
        manga.setAuthor(request.getAuthor());

        List<Genre> genres = new ArrayList<>();
        if (request.getGenres() != null && !request.getGenres().isEmpty()) {
            for (var genreName : request.getGenres()) {
                var genre = genreRepository.findByName(genreName);
                genres.add(genre);
            }
            manga.setGenres(genres);
        }
        if (request.getChapters() != null && !request.getChapters().isEmpty()) {
            var chapters = chapterRepository.findAllById(request.getChapters());
            manga.setChapters(new ArrayList<>(chapters));
        }
        mangaRepository.save(manga);
        return mangaMapper.toMangaResponse(manga);
    }

}
