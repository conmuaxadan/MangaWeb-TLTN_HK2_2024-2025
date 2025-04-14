package com.raindrop.manga_service.repository;

import com.raindrop.manga_service.entity.Manga;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface MangaRepository extends JpaRepository<Manga, String>, JpaSpecificationExecutor<Manga> {
    Manga findByTitle(String name);
    Optional<Manga> findById(String mangaId);

    /**
     * Tăng lượt xem của manga mà không cập nhật thời gian updatedAt
     * @param id ID của manga
     * @return Số bản ghi được cập nhật
     */
    @Modifying
    @Transactional
    @Query("UPDATE Manga m SET m.views = m.views + 1 WHERE m.id = :id")
    int incrementViews(@Param("id") String id);
}
