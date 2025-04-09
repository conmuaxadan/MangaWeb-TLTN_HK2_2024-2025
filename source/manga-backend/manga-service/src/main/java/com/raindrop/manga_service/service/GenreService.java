package com.raindrop.manga_service.service;

import com.raindrop.manga_service.dto.request.GenreRequest;
import com.raindrop.manga_service.dto.response.GenreResponse;
import com.raindrop.manga_service.entity.Genre;
import com.raindrop.manga_service.enums.ErrorCode;
import com.raindrop.manga_service.exception.AppException;
import com.raindrop.manga_service.mapper.GenreMapper;
import com.raindrop.manga_service.repository.ChapterRepository;
import com.raindrop.manga_service.repository.GenreRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class GenreService {
    GenreRepository genreRepository;
    GenreMapper genreMapper;

    public GenreResponse createGenre(GenreRequest request){
        var genre = genreMapper.toGenre(request);
        genreRepository.save(genre);

        return genreMapper.toGenreResponse(genre);
    }

    public GenreResponse getGenre(String name){
        var genre = genreRepository.findByName(name);
        if (genre == null) {
            throw new AppException(ErrorCode.GENRE_NOT_FOUND);
        }
        return genreMapper.toGenreResponse(genre);
    }

    public List<GenreResponse> getAllGenres(){
        return genreRepository.findAll().stream().map(genreMapper::toGenreResponse).toList();
    }

    public void deleteGenre(String name){
        var genre = genreRepository.findByName(name);
        if (genre == null) {
            throw new AppException(ErrorCode.GENRE_NOT_FOUND);
        }
        genreRepository.delete(genre);
    }

    public GenreResponse updateGenre(String name, GenreRequest request){
        var genre = genreRepository.findByName(name);
        if (genre == null) {
            throw new AppException(ErrorCode.GENRE_NOT_FOUND);
        }
        genre.setName(request.getName());
        genre.setDescription(request.getDescription());
        genreRepository.save(genre);

        return genreMapper.toGenreResponse(genre);
    }

}
