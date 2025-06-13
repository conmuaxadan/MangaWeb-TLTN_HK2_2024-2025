import { historyHttpClient } from './http-client.js';
import mangaService from './manga-service.js';
import userService from './user-service.js';
import commentService from './comment-service.js';
import favoriteService from './favorite-service.js';

/**
 * Service để lấy thông tin thống kê
 */
const statisticsService = {
    /**
     * Lấy thông tin thống kê tổng hợp
     * @returns Thông tin thống kê tổng hợp
     */
    async getOverviewStatistics() {
        try {
            console.log('Bắt đầu lấy thông tin thống kê');
            const stats = {
                totalUsers: 0,
                totalMangas: 0,
                totalViews: 0,
                totalComments: 0,
                totalFavorites: 0,
                newUsersToday: 0,
                newMangasToday: 0,
                viewsToday: 0,
                commentsToday: 0,
                favoritesToday: 0,
                viewsThisWeek: 0,
                viewsThisMonth: 0
            };

            console.log('Thông tin thống kê mặc định:', stats);

            // Lấy thống kê người dùng từ API duy nhất
            try {
                const userStats = await userService.getUserStatistics();
                console.log('Kết quả lấy thống kê người dùng:', userStats);

                if (userStats) {
                    stats.totalUsers = userStats.totalUsers || 0;
                    stats.newUsersToday = userStats.newUsersToday || 0;
                    stats.newUsersThisWeek = userStats.newUsersThisWeek || 0;
                    stats.newUsersThisMonth = userStats.newUsersThisMonth || 0;

                    // Chuyển đổi usersByDay từ Map thành Array cho chart
                    if (userStats.usersByDay) {
                        stats.usersByDay = Object.entries(userStats.usersByDay).map(([date, count]) => ({
                            date,
                            count: count || 0
                        }));
                    }

                    // Chuyển đổi usersByAuthProvider từ Map thành Array cho chart
                    if (userStats.usersByAuthProvider) {
                        stats.usersByAuthProvider = Object.entries(userStats.usersByAuthProvider).map(([provider, count]) => ({
                            provider,
                            count: count || 0
                        }));
                    }
                }
            } catch (error) {
                console.error('Lỗi khi lấy thông tin người dùng:', error);
            }

            // Lấy thống kê về truyện
            try {
                // Sử dụng API mới để lấy thống kê tổng hợp về truyện
                const mangaStats = await mangaService.getMangaStatistics();
                console.log('Kết quả lấy thống kê truyện:', mangaStats);

                if (mangaStats) {
                    // Cập nhật thống kê tổng số truyện và số truyện mới trong ngày
                    stats.totalMangas = mangaStats.activeMangas; // Chỉ đếm truyện chưa bị xóa
                    stats.newMangasToday = mangaStats.newMangasToday;

                    // Thêm dữ liệu cho biểu đồ
                    stats.mangasByGenre = mangaStats.mangasByGenre || {};
                    stats.mangasByStatus = mangaStats.mangasByStatus || {};
                }
            } catch (error) {
                console.error('Lỗi khi lấy thống kê truyện:', error);
            }

            // Lấy tổng lượt xem từ history service
            try {
                // Gọi API mới để lấy tổng lượt xem chính xác
                const viewsResponse = await historyHttpClient.get('/statistics/total');
                console.log('Kết quả lấy tổng lượt xem:', viewsResponse);
                if (viewsResponse && viewsResponse.result !== undefined) {
                    stats.totalViews = viewsResponse.result;
                }

                // Lấy số lượt xem trong ngày
                const todayViewsResponse = await historyHttpClient.get('/statistics/today');
                console.log('Kết quả lấy lượt xem trong ngày:', todayViewsResponse);
                if (todayViewsResponse && todayViewsResponse.result !== undefined) {
                    stats.viewsToday = todayViewsResponse.result;
                }

                // Lấy số lượt xem trong tuần này
                const thisWeekViewsResponse = await historyHttpClient.get('/statistics/week');
                console.log('Kết quả lấy lượt xem trong tuần:', thisWeekViewsResponse);
                if (thisWeekViewsResponse && thisWeekViewsResponse.result !== undefined) {
                    stats.viewsThisWeek = thisWeekViewsResponse.result;
                }

                // Lấy số lượt xem trong tháng này
                const thisMonthViewsResponse = await historyHttpClient.get('/statistics/month');
                console.log('Kết quả lấy lượt xem trong tháng:', thisMonthViewsResponse);
                if (thisMonthViewsResponse && thisMonthViewsResponse.result !== undefined) {
                    stats.viewsThisMonth = thisMonthViewsResponse.result;
                }
            } catch (error) {
                console.error('Lỗi khi lấy thống kê lượt xem:', error);
                // Giữ nguyên giá trị mặc định nếu gặp lỗi
            }

            // Lấy thống kê về bình luận
            try {
                // Lấy tổng số bình luận
                const totalCommentsResponse = await commentService.countTotalComments();
                console.log('Kết quả lấy tổng số bình luận:', totalCommentsResponse);
                stats.totalComments = totalCommentsResponse;

                // Lấy số bình luận mới trong ngày
                const todayCommentsResponse = await commentService.countTodayComments();
                console.log('Kết quả lấy số bình luận mới trong ngày:', todayCommentsResponse);
                stats.commentsToday = todayCommentsResponse;
            } catch (error) {
                console.error('Lỗi khi lấy thống kê bình luận:', error);
                // Giữ nguyên giá trị mặc định nếu gặp lỗi
            }

            // Lấy thống kê về yêu thích
            try {
                // Lấy tổng số yêu thích
                const totalFavoritesResponse = await favoriteService.countTotalFavorites();
                console.log('Kết quả lấy tổng số yêu thích:', totalFavoritesResponse);
                stats.totalFavorites = totalFavoritesResponse;

                // Lấy số yêu thích mới trong ngày
                const todayFavoritesResponse = await favoriteService.countTodayFavorites();
                console.log('Kết quả lấy số yêu thích mới trong ngày:', todayFavoritesResponse);
                stats.favoritesToday = todayFavoritesResponse;
            } catch (error) {
                console.error('Lỗi khi lấy thống kê yêu thích:', error);
                // Giữ nguyên giá trị mặc định nếu gặp lỗi
            }

            console.log('Thông tin thống kê cuối cùng:', stats);
            return stats;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin thống kê tổng hợp:', error);
            return null;
        }
    },

    /**
     * Lấy thống kê lượt xem theo ngày
     * @param days Số ngày cần lấy (mặc định là 7)
     * @returns Danh sách thống kê lượt xem theo ngày
     */
    async getViewsByDay(days = 7) {
        try {
            console.log(`Bắt đầu lấy thống kê lượt xem theo ngày (${days} ngày)`);

            const response = await historyHttpClient.get(`/statistics/by-day?days=${days}`);
            console.log('Kết quả lấy lượt xem theo ngày:', response);

            if (response && response.code === 200 && response.result) {
                return response.result;
            }

            return [];
        } catch (error) {
            console.error('Lỗi khi lấy thống kê lượt xem theo ngày:', error);
            return [];
        }
    },

    /**
     * Lấy thống kê lượt xem theo ngày với date range
     * @param startDate Ngày bắt đầu (format: yyyy-MM-dd)
     * @param endDate Ngày kết thúc (format: yyyy-MM-dd)
     * @returns Danh sách thống kê lượt xem theo ngày
     */
    async getViewsByDateRange(startDate, endDate) {
        try {
            console.log(`Bắt đầu lấy thống kê lượt xem theo ngày từ ${startDate} đến ${endDate}`);

            const response = await historyHttpClient.get(`/statistics/by-day?startDate=${startDate}&endDate=${endDate}`);
            console.log('Kết quả lấy lượt xem theo date range:', response);

            if (response && response.code === 200 && response.result) {
                return response.result;
            }

            return [];
        } catch (error) {
            console.error('Lỗi khi lấy thống kê lượt xem theo date range:', error);
            return [];
        }
    },

    /**
     * Lấy thống kê lượt xem theo truyện với date range
     * @param startDate Ngày bắt đầu (format: yyyy-MM-dd)
     * @param endDate Ngày kết thúc (format: yyyy-MM-dd)
     * @param limit Số lượng truyện cần lấy
     * @returns Danh sách thống kê lượt xem theo truyện
     */
    async getViewsByMangaDateRange(startDate, endDate, limit = 10) {
        try {
            console.log(`Bắt đầu lấy thống kê lượt xem theo truyện từ ${startDate} đến ${endDate}, limit: ${limit}`);

            const response = await historyHttpClient.get(`/statistics/by-manga?startDate=${startDate}&endDate=${endDate}&limit=${limit}`);
            console.log('Kết quả lấy lượt xem theo truyện date range:', response);

            if (response && response.code === 200 && response.result) {
                return response.result;
            }

            return [];
        } catch (error) {
            console.error('Lỗi khi lấy thống kê lượt xem theo truyện date range:', error);
            return [];
        }
    },

    /**
     * Lấy thống kê lượt xem theo truyện
     * @param days Số ngày cần lấy (mặc định là 0, lấy tất cả)
     * @param limit Số lượng truyện cần lấy (mặc định là 10)
     * @returns Danh sách thống kê lượt xem theo truyện
     */
    async getViewsByManga(days = 0, limit = 10) {
        try {
            console.log(`Bắt đầu lấy thống kê lượt xem theo truyện (${days > 0 ? days + ' ngày, ' : ''}${limit} truyện)`);

            const response = await historyHttpClient.get(`/statistics/by-manga?days=${days}&limit=${limit}`);
            console.log('Kết quả lấy lượt xem theo truyện:', response);

            if (response && response.code === 200 && response.result) {
                return response.result;
            }

            return [];
        } catch (error) {
            console.error('Lỗi khi lấy thống kê lượt xem theo truyện:', error);
            return [];
        }
    }
};

export default statisticsService;
