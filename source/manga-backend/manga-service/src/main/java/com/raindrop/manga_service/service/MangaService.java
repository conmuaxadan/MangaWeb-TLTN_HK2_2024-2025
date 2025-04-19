package com.raindrop.manga_service.service;

import com.raindrop.manga_service.dto.request.AdvancedSearchRequest;
import com.raindrop.manga_service.dto.request.MangaRequest;
import com.raindrop.manga_service.dto.response.MangaResponse;
import com.raindrop.manga_service.dto.response.MangaSummaryResponse;
import com.raindrop.manga_service.entity.Genre;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.enums.ErrorCode;
import com.raindrop.manga_service.exception.AppException;
import com.raindrop.manga_service.mapper.MangaMapper;
import com.raindrop.manga_service.repository.ChapterRepository;
import com.raindrop.manga_service.repository.GenreRepository;
import com.raindrop.manga_service.repository.MangaRepository;
import com.raindrop.manga_service.repository.httpclient.UploadClient;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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

    @Transactional
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

        // Thiết lập năm phát hành và tình trạng
        manga.setYearOfRelease(request.getYearOfRelease());
        manga.setStatus(request.getStatus());

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
        MangaResponse response = mangaMapper.toMangaResponse(manga);
        return response;
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

        // Chuyển đổi Manga sang MangaSummaryResponse và thêm lastChapterNumber
        Page<MangaSummaryResponse> mangaSummaryResponsePage = mangasPage.map(manga -> {
            MangaSummaryResponse response = mangaMapper.toMangaSummaryResponse(manga);

            // Nếu có lastChapterId, tìm chapter tương ứng để lấy chapterNumber
            if (manga.getLastChapterId() != null) {
                chapterRepository.findById(manga.getLastChapterId()).ifPresent(chapter -> {
                    response.setLastChapterNumber(chapter.getChapterNumber());
                });
            }

            return response;
        });

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
                uploadClient.deleteMedia(header,manga.getCoverUrl());
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
        manga.setYearOfRelease(request.getYearOfRelease());
        manga.setStatus(request.getStatus());

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

    /**
     * Tìm kiếm nâng cao manga
     * @param searchRequest Yêu cầu tìm kiếm nâng cao
     * @param pageable Thông tin phân trang
     * @return Danh sách manga phù hợp với điều kiện tìm kiếm
     */
    public Page<MangaResponse> advancedSearch(AdvancedSearchRequest searchRequest, Pageable pageable) {
        log.info("Advanced search with request: {}", searchRequest);

        // Tạo Specification để xây dựng truy vấn động
        Specification<Manga> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Tìm kiếm theo tiêu đề
            if (searchRequest.getTitle() != null && !searchRequest.getTitle().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("title")),
                        "%" + searchRequest.getTitle().toLowerCase() + "%"));
            }

            // Tìm kiếm theo tác giả
            if (searchRequest.getAuthor() != null && !searchRequest.getAuthor().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("author")),
                        "%" + searchRequest.getAuthor().toLowerCase() + "%"));
            }

            // Tìm kiếm theo thể loại
            if (searchRequest.getGenres() != null && !searchRequest.getGenres().isEmpty()) {
                Join<Object, Object> genresJoin = root.join("genres", JoinType.INNER);
                predicates.add(genresJoin.get("name").in(searchRequest.getGenres()));
            }

            // Tìm kiếm theo năm phát hành
            if (searchRequest.getYearOfRelease() != null) {
                predicates.add(criteriaBuilder.equal(root.get("yearOfRelease"), searchRequest.getYearOfRelease()));
            }

            // Tìm kiếm theo tình trạng
            if (searchRequest.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), searchRequest.getStatus()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        // Thực hiện tìm kiếm với Specification và Pageable
        Page<Manga> mangaPage = mangaRepository.findAll(spec, pageable);
        log.info("Found {} mangas matching the search criteria", mangaPage.getTotalElements());

        // Chuyển đổi kết quả sang DTO
        return mangaPage.map(mangaMapper::toMangaResponse);
    }

}
