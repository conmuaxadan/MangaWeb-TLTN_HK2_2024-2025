package com.raindrop.manga_service.service;

import com.raindrop.manga_service.dto.request.MangaRequest;
import com.raindrop.manga_service.dto.response.MangaResponse;
import com.raindrop.manga_service.entity.Genre;
import com.raindrop.manga_service.entity.Manga;
import com.raindrop.manga_service.mapper.MangaMapper;
import com.raindrop.manga_service.repository.ChapterRepository;
import com.raindrop.manga_service.repository.GenreRepository;
import com.raindrop.manga_service.repository.MangaRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class MangaService {
    MangaRepository mangaRepository;
    MangaMapper mangaMapper;
    GenreRepository genreRepository;
    ChapterRepository chapterRepository;

    public MangaResponse createManga(MangaRequest request){
        var manga = mangaMapper.toManga(request);
        var genres = new HashSet<Genre>();
        for (var genreName : request.getGenres()) {
            var genre = genreRepository.findByName(genreName);
            genres.add(genre);
        }
        manga.setGenres(genres);
        mangaRepository.save(manga);

        return mangaMapper.toMangaResponse(manga);
    }

    public MangaResponse getMangaByName(String title){
        var manga = mangaRepository.findByTitle(title);
        return mangaMapper.toMangaResponse(manga);
    }

    public MangaResponse getMangaById(String id){
        var manga = mangaRepository.findById(id);
        return mangaMapper.toMangaResponse(manga.orElseThrow(() -> new RuntimeException("Manga not found")));
    }


    public List<MangaResponse> getAllMangas(){
        return mangaRepository.findAll().stream().map(mangaMapper::toMangaResponse).toList();
    }

    public void deleteManga(String id){
        var manga = mangaRepository.findById(id).orElseThrow(()-> new RuntimeException("Manga not found"));
        mangaRepository.delete(manga);
    }

    public MangaResponse updateManga(String title, MangaRequest request) {
        var manga = mangaRepository.findByTitle(title);

        manga.setTitle(request.getTitle());
        manga.setDescription(request.getDescription());
        manga.setAuthor(request.getAuthor());

        var genres = new HashSet<Genre>();
        if (request.getGenres() != null && !request.getGenres().isEmpty()) {
            for (var genreName : request.getGenres()) {
                var genre = genreRepository.findByName(genreName);
                genres.add(genre);
            }
            manga.setGenres(genres);
        }
        if (request.getChapters() != null && !request.getChapters().isEmpty()) {
            var chapters = chapterRepository.findAllById(request.getChapters());
            manga.setChapters(new HashSet<>(chapters));
        }
        mangaRepository.save(manga);
        return mangaMapper.toMangaResponse(manga);
    }

}
