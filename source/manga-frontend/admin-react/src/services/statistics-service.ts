import {  historyHttpClient } from './http-client';
import mangaService from './manga-service';
import userService from './user-service';
import commentService from './comment-service';
import favoriteService from './favorite-service';
import {ApiResponse} from "../interfaces/models/ApiResponse.ts";

// Interface cho dữ liệu lượt xem theo ngày
export interface ViewsByDayResponse {
    date: string;
    views: number;
    registeredUserViews: number;
    anonymousViews: number;
}

// Interface cho dữ liệu lượt xem theo truyện
export interface MangaViewsResponse {
    mangaId: string;
    title: string;
    totalViews: number;
    registeredUserViews: number;
    anonymousViews: number;
}

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
                viewsThisMonth:0
            };

            console.log('Thông tin thống kê mặc định:', stats);

            // Lấy tổng số người dùng và số người dùng mới trong ngày
            try {
                // Lấy tổng số người dùng
                const usersResponse = await userService.getUsersPaginated(0, 1);
                console.log('Kết quả lấy tổng số người dùng:', usersResponse);
                if (usersResponse && usersResponse.totalElements !== undefined) {
                    stats.totalUsers = usersResponse.totalElements;
                }

                // Lấy danh sách người dùng mới nhất để đếm số người dùng mới trong ngày
                const recentUsers = await userService.getUsersPaginated(0, 20, 'createdAt,desc');
                if (recentUsers && recentUsers.content) {
                    // Lấy ngày hiện tại (không bao gồm giờ, phút, giây)
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // Đếm số người dùng có ngày tạo là ngày hôm nay
                    const newUsersToday = recentUsers.content.filter((user: { createdAt: string | number | Date; }) => {
                        if (!user.createdAt) return false;
                        const createdDate = new Date(user.createdAt);
                        return createdDate >= today;
                    }).length;

                    stats.newUsersToday = newUsersToday;
                    console.log('Số người dùng mới trong ngày:', newUsersToday);
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

                    console.log('Tổng số truyện (chưa bị xóa):', mangaStats.activeMangas);
                    console.log('Số truyện mới trong ngày:', mangaStats.newMangasToday);
                    console.log('Số truyện đã bị xóa:', mangaStats.deletedMangas);
                }
            } catch (error) {
                console.error('Lỗi khi lấy thống kê truyện:', error);

                // Nếu không lấy được thống kê, thử sử dụng cách cũ để đếm tổng số truyện
                try {
                    const mangasResponse = await mangaService.searchManga('', 0, 1);
                    console.log('Kết quả lấy tổng số truyện (cách cũ):', mangasResponse);
                    if (mangasResponse && mangasResponse.totalElements !== undefined) {
                        stats.totalMangas = mangasResponse.totalElements;
                    }
                } catch (innerError) {
                    console.error('Lỗi khi lấy tổng số truyện (cách cũ):', innerError);
                }
            }

            // Lấy tổng lượt xem từ history service
            try {
                // Gọi API mới để lấy tổng lượt xem chính xác
                const viewsResponse = await historyHttpClient.get<ApiResponse<number>>('/statistics/total');
                console.log('Kết quả lấy tổng lượt xem:', viewsResponse);
                if (viewsResponse && viewsResponse.result !== undefined) {
                    stats.totalViews = viewsResponse.result;
                }

                // Lấy số lượt xem trong ngày
                const todayViewsResponse = await historyHttpClient.get<ApiResponse<number>>('/statistics/today');
                console.log('Kết quả lấy lượt xem trong ngày:', todayViewsResponse);
                if (todayViewsResponse && todayViewsResponse.result !== undefined) {
                    stats.viewsToday = todayViewsResponse.result;
                }

                // Lấy số lượt xem trong tuần này
                const thisWeekViewsResponse = await historyHttpClient.get<ApiResponse<number>>('/statistics/week');
                console.log('Kết quả lấy lượt xem trong tuần:', thisWeekViewsResponse);
                if (thisWeekViewsResponse && thisWeekViewsResponse.result !== undefined) {
                    stats.viewsThisWeek = thisWeekViewsResponse.result;
                }

                // Lấy số lượt xem trong tháng này
                const thisMonthViewsResponse = await historyHttpClient.get<ApiResponse<number>>('/statistics/month');
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
    async getViewsByDay(days: number = 7) {
        try {
            console.log(`Bắt đầu lấy thống kê lượt xem theo ngày (${days} ngày)`);

            const response = await historyHttpClient.get<ApiResponse<ViewsByDayResponse[]>>(`/statistics/by-day?days=${days}`);
            console.log('Kết quả lấy lượt xem theo ngày:', response);

            if (response && response.code === 1000 && response.result) {
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
    async getViewsByDateRange(startDate: string, endDate: string) {
        try {
            console.log(`Bắt đầu lấy thống kê lượt xem theo ngày từ ${startDate} đến ${endDate}`);

            const response = await historyHttpClient.get<ApiResponse<ViewsByDayResponse[]>>(`/statistics/by-day?startDate=${startDate}&endDate=${endDate}`);
            console.log('Kết quả lấy lượt xem theo date range:', response);

            if (response && response.code === 1000 && response.result) {
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
    async getViewsByMangaDateRange(startDate: string, endDate: string, limit: number = 10) {
        try {
            console.log(`Bắt đầu lấy thống kê lượt xem theo truyện từ ${startDate} đến ${endDate}, limit: ${limit}`);

            const response = await historyHttpClient.get<ApiResponse<MangaViewsResponse[]>>(`/statistics/by-manga?startDate=${startDate}&endDate=${endDate}&limit=${limit}`);
            console.log('Kết quả lấy lượt xem theo truyện date range:', response);

            if (response && response.code === 1000 && response.result) {
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
    async getViewsByManga(days: number = 0, limit: number = 10) {
        try {
            console.log(`Bắt đầu lấy thống kê lượt xem theo truyện (${days > 0 ? days + ' ngày, ' : ''}${limit} truyện)`);

            const response = await historyHttpClient.get<ApiResponse<MangaViewsResponse[]>>(`/statistics/by-manga?days=${days}&limit=${limit}`);
            console.log('Kết quả lấy lượt xem theo truyện:', response);

            if (response && response.code === 1000 && response.result) {
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
