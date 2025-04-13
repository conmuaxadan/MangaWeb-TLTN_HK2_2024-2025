package com.raindrop.manga_service.service;

import com.raindrop.manga_service.dto.request.MangaRequest;
import com.raindrop.manga_service.dto.response.MangaResponse;
import com.raindrop.manga_service.dto.response.MangaSummaryResponse;
import com.raindrop.manga_service.entity.Chapter;
import com.raindrop.manga_service.entity.Genre;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.enums.ErrorCode;
import com.raindrop.manga_service.exception.AppException;
import com.raindrop.manga_service.mapper.MangaMapper;
import com.raindrop.manga_service.repository.ChapterRepository;
import com.raindrop.manga_service.repository.GenreRepository;
import com.raindrop.manga_service.repository.MangaRepository;
import com.raindrop.manga_service.repository.httpclient.UploadClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

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
    UploadClient uploadClient;

    public MangaResponse createManga(MangaRequest request) {
        // Kiểm tra xem manga đã tồn tại chưa
        Manga existingManga = mangaRepository.findByTitle(request.getTitle());
        if (existingManga != null) {
            throw new AppException(ErrorCode.MANGA_ALREADY_EXISTS);
        }
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        var header = attributes.getRequest().getHeader("Authorization");

        var manga = mangaMapper.toManga(request);

        // Khởi tạo danh sách genres rỗng
        manga.setGenres(new ArrayList<>());
        manga = mangaRepository.save(manga);

        // Xử lý genres
        if (request.getGenres() != null && !request.getGenres().isEmpty()) {
            List<Genre> genres = new ArrayList<>();
            for (var genreName : request.getGenres()) {
                var genre = genreRepository.findByName(genreName);
                if (genre == null) {
                    throw new AppException(ErrorCode.GENRE_NOT_FOUND);
                }
                genres.add(genre);
            }
            manga.getGenres().addAll(genres);
            manga = mangaRepository.save(manga);
        }

        // Upload ảnh bìa nếu có
        if (request.getCover() != null && !request.getCover().isEmpty()) {
            try {
                log.info("Uploading cover image for manga: {}", request.getTitle());
                var response = uploadClient.uploadMedia(header,request.getCover());
                manga.setCoverUrl(response.getResult().getName());
                log.info("Cover image uploaded successfully: {}", response.getResult().getName());
            } catch (Exception e) {
                log.error("Error uploading cover image: {}", e.getMessage());
                throw new AppException(ErrorCode.COVER_UPLOAD_FAILED);
            }
        }

        manga = mangaRepository.save(manga);


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
                .coverUrl(manga.getCoverUrl())
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

    /**
     * Lấy danh sách tóm tắt manga có phân trang
     * @param pageable Thông tin phân trang
     * @return Danh sách tóm tắt manga có phân trang
     */
    public Page<MangaSummaryResponse> getMangaSummariesPaginated(Pageable pageable) {
        log.info("Getting paginated manga summaries with page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Manga> mangasPage = mangaRepository.findAll(pageable);
        Page<MangaSummaryResponse> mangaSummaryResponsePage = mangasPage.map(mangaMapper::toMangaSummaryResponse);
        log.info("Retrieved {} manga summaries out of {} total", mangaSummaryResponsePage.getNumberOfElements(), mangaSummaryResponsePage.getTotalElements());
        return mangaSummaryResponsePage;
    }

    public void deleteManga(String id) {
        var manga = mangaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));
        mangaRepository.delete(manga);
    }

    public MangaResponse updateManga(String id, MangaRequest request) {
        var manga = mangaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MANGA_NOT_FOUND));

        // Kiểm tra xem title mới đã tồn tại chưa (nếu title thay đổi)
        if (!manga.getTitle().equals(request.getTitle())) {
            Manga existingManga = mangaRepository.findByTitle(request.getTitle());
            if (existingManga != null) {
                throw new AppException(ErrorCode.MANGA_ALREADY_EXISTS);
            }
        }

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        var header = attributes.getRequest().getHeader("Authorization");

        // Upload ảnh bìa mới nếu có
        if (request.getCover() != null && !request.getCover().isEmpty()) {
            try {
                log.info("Uploading new cover image for manga: {}", manga.getTitle());
                var response = uploadClient.uploadMedia(header,request.getCover());
                manga.setCoverUrl(response.getResult().getName());
                log.info("New cover image uploaded successfully: {}", response.getResult().getName());
            } catch (Exception e) {
                log.error("Error uploading new cover image: {}", e.getMessage());
                throw new AppException(ErrorCode.COVER_UPLOAD_FAILED);
            }
        }

        manga.setTitle(request.getTitle());
        manga.setDescription(request.getDescription());
        manga.setAuthor(request.getAuthor());

        // Xử lý genres - xóa tất cả genres hiện tại và thêm lại các genres mới
        manga.getGenres().clear(); // Xóa tất cả genres hiện tại

        if (request.getGenres() != null && !request.getGenres().isEmpty()) {
            List<Genre> newGenres = new ArrayList<>();
            for (var genreName : request.getGenres()) {
                var genre = genreRepository.findByName(genreName);
                if (genre == null) {
                    throw new AppException(ErrorCode.GENRE_NOT_FOUND);
                }
                newGenres.add(genre);
            }
            manga.getGenres().addAll(newGenres); // Thêm các genres mới
        }
        mangaRepository.save(manga);
        return mangaMapper.toMangaResponse(manga);
    }

}
