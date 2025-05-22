package com.raindrop.identity_service.service;

import com.raindrop.identity_service.dto.response.UserStatisticsResponse;
import com.raindrop.identity_service.repository.UserRepository;
import com.raindrop.identity_service.repository.UserStatisticsRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service xử lý thống kê người dùng
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserStatisticsService {
    
    UserRepository userRepository;
    UserStatisticsRepository userStatisticsRepository;
    
    /**
     * Lấy thống kê tổng hợp về người dùng
     * @return Thống kê tổng hợp về người dùng
     */
    public UserStatisticsResponse getUserStatistics() {
        log.info("Getting user statistics");
        
        // Lấy thời điểm bắt đầu của ngày, tuần, tháng hiện tại
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfWeek = now.toLocalDate().minusDays(now.getDayOfWeek().getValue() - 1).atStartOfDay();
        LocalDateTime startOfMonth = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
        
        // Lấy thời điểm bắt đầu và kết thúc cho 7 ngày gần nhất
        LocalDateTime startDate = now.toLocalDate().minusDays(6).atStartOfDay();
        LocalDateTime endDate = now.toLocalDate().atTime(LocalTime.MAX);
        
        // Đếm tổng số người dùng
        Long totalUsers = userRepository.count();
        
        // Đếm số người dùng mới trong ngày, tuần, tháng
        Long newUsersToday = userStatisticsRepository.countNewUsersToday(startOfDay);
        Long newUsersThisWeek = userStatisticsRepository.countNewUsersThisWeek(startOfWeek);
        Long newUsersThisMonth = userStatisticsRepository.countNewUsersThisMonth(startOfMonth);
        
        // Đếm số người dùng theo phương thức đăng nhập
        Map<String, Long> usersByAuthProvider = new HashMap<>();
        userStatisticsRepository.countUsersByAuthProvider().forEach(row -> {
            String provider = row[0].toString();
            Long count = ((Number) row[1]).longValue();
            usersByAuthProvider.put(provider, count);
        });
        
        // Đếm số người dùng mới theo ngày trong 7 ngày gần nhất
        Map<String, Long> usersByDay = new HashMap<>();
        
        // Khởi tạo map với 7 ngày gần nhất, giá trị mặc định là 0
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (int i = 0; i <= 6; i++) {
            LocalDate date = now.toLocalDate().minusDays(6 - i);
            usersByDay.put(date.format(formatter), 0L);
        }
        
        // Cập nhật số lượng người dùng mới theo ngày
        userStatisticsRepository.countNewUsersByDay(startDate, endDate).forEach(row -> {
            String date = row[0].toString();
            Long count = ((Number) row[1]).longValue();
            usersByDay.put(date, count);
        });
        
        // Tạo response
        return UserStatisticsResponse.builder()
                .totalUsers(totalUsers)
                .newUsersToday(newUsersToday)
                .newUsersThisWeek(newUsersThisWeek)
                .newUsersThisMonth(newUsersThisMonth)
                .usersByAuthProvider(usersByAuthProvider)
                .usersByDay(usersByDay)
                .build();
    }
}
