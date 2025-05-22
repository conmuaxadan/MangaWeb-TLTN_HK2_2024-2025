package com.raindrop.identity_service.repository;

import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.enums.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Repository để lấy thống kê về người dùng
 */
@Repository
public interface UserStatisticsRepository extends JpaRepository<User, String> {
    
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
    @Query("SELECT FUNCTION('DATE', u.createdAt) as date, COUNT(u) as count FROM User u WHERE u.createdAt BETWEEN :startDate AND :endDate GROUP BY FUNCTION('DATE', u.createdAt) ORDER BY date")
    List<Object[]> countNewUsersByDay(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
