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
    Optional<User> findByDisplayName(String displayName);

    /**
     * Tìm kiếm và lọc người dùng theo nhiều tiêu chí
     * @param keyword Từ khóa tìm kiếm
     * @param roleId ID của vai trò (nếu có)
     * @param provider Nhà cung cấp xác thực (nếu có)
     * @param enabled Trạng thái tài khoản (nếu có)
     * @param pageable Thông tin phân trang
     * @return Danh sách người dùng phân trang
     */
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

    /**
     * Tìm kiếm người dùng theo từ khóa (username, email, displayName)
     * @param keyword Từ khóa tìm kiếm
     * @param pageable Thông tin phân trang
     * @return Danh sách người dùng phân trang
     */
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.displayName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<User> searchUsers(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Đếm số người dùng mới trong ngày
     * @param startOfDay Thời điểm bắt đầu của ngày
     * @return Số người dùng mới trong ngày
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :startOfDay")
    Long countNewUsersToday(@Param("startOfDay") LocalDateTime startOfDay);

    /**
     * Đếm số người dùng mới trong tuần
     * @param startOfWeek Thời điểm bắt đầu của tuần
     * @return Số người dùng mới trong tuần
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :startOfWeek")
    Long countNewUsersThisWeek(@Param("startOfWeek") LocalDateTime startOfWeek);

    /**
     * Đếm số người dùng mới trong tháng
     * @param startOfMonth Thời điểm bắt đầu của tháng
     * @return Số người dùng mới trong tháng
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :startOfMonth")
    Long countNewUsersThisMonth(@Param("startOfMonth") LocalDateTime startOfMonth);

    /**
     * Đếm số người dùng theo phương thức đăng nhập
     * @return Danh sách số lượng người dùng theo phương thức đăng nhập
     */
    @Query("SELECT u.authProvider as provider, COUNT(u) as count FROM User u GROUP BY u.authProvider")
    List<Object[]> countUsersByAuthProvider();

    /**
     * Đếm số người dùng mới theo ngày trong khoảng thời gian
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @return Danh sách số lượng người dùng mới theo ngày
     */
    @Query("SELECT FUNCTION('DATE', u.createdAt) as date, COUNT(u) as count FROM User u WHERE u.createdAt BETWEEN :startDate AND :endDate GROUP BY FUNCTION('DATE', u.createdAt) ORDER BY FUNCTION('DATE', u.createdAt)")
    List<Object[]> countNewUsersByDay(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

}
