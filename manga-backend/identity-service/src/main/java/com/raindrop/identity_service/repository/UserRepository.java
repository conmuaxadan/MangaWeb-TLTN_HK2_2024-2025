package com.raindrop.identity_service.repository;

import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.enums.AuthProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByDisplayName(String displayName);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    List<User> findAllByEmail(String email);

    @Query("SELECT DISTINCT u FROM User u " +
           "LEFT JOIN u.roles r " +
           "WHERE (:keyword IS NULL OR " +
           "    LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "    LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "    LOWER(u.displayName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:roleId IS NULL OR r.id = :roleId) " +
           "AND (:provider IS NULL OR u.authProvider = :provider) " +
           "AND (:enabled IS NULL OR u.enabled = :enabled)")
    Page<User> searchAndFilterUsers(
            @Param("keyword") String keyword,
            @Param("roleId") Integer roleId,
            @Param("provider") AuthProvider provider,
            @Param("enabled") Boolean enabled,
            Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :startOfDay")
    Long countNewUsersToday(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :startOfWeek")
    Long countNewUsersThisWeek(@Param("startOfWeek") LocalDateTime startOfWeek);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :startOfMonth")
    Long countNewUsersThisMonth(@Param("startOfMonth") LocalDateTime startOfMonth);

    @Query("SELECT u.authProvider as provider, COUNT(u) as count FROM User u GROUP BY u.authProvider")
    List<Object[]> countUsersByAuthProvider();

    @Query("SELECT FUNCTION('DATE', u.createdAt) as date, COUNT(u) as count FROM User u WHERE u.createdAt BETWEEN :startDate AND :endDate GROUP BY FUNCTION('DATE', u.createdAt) ORDER BY FUNCTION('DATE', u.createdAt)")
    List<Object[]> countNewUsersByDay(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

}
