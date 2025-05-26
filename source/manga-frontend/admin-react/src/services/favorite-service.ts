import { favoriteHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { logApiCall } from "../utils/api-logger";

class FavoriteService {
    /**
     * Đếm tổng số yêu thích trong hệ thống
     * @returns Tổng số yêu thích hoặc 0 nếu thất bại
     */
    async countTotalFavorites(): Promise<number> {
        logApiCall('countTotalFavorites');
        try {
            const apiResponse = await favoriteHttpClient.get<ApiResponse<number>>('/favorites/count');

            if (apiResponse.code !== 200) {
                console.error(apiResponse.message || "Không thể đếm tổng số yêu thích");
                return 0;
            }

            return apiResponse.result;
        } catch (error) {
            console.error('Lỗi đếm tổng số yêu thích:', error);
            return 0;
        }
    }

    /**
     * Đếm số yêu thích mới trong ngày hôm nay
     * @returns Số yêu thích mới trong ngày hoặc 0 nếu thất bại
     */
    async countTodayFavorites(): Promise<number> {
        logApiCall('countTodayFavorites');
        try {
            const apiResponse = await favoriteHttpClient.get<ApiResponse<number>>('/favorites/count/today');

            if (apiResponse.code !== 200) {
                console.error(apiResponse.message || "Không thể đếm số yêu thích mới trong ngày");
                return 0;
            }

            return apiResponse.result;
        } catch (error) {
            console.error('Lỗi đếm số yêu thích mới trong ngày:', error);
            return 0;
        }
    }
}

// Tạo một instance của FavoriteService
const favoriteService = new FavoriteService();
export default favoriteService;
