import { toast } from "react-toastify";
import { identityHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { logApiCall } from "../utils/api-logger";

// Interface cho thống kê người dùng
export interface UserStatisticsResponse {
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    usersByAuthProvider: Record<string, number>;
    usersByDay: Record<string, number>;
}

class UserStatisticsService {
    /**
     * Lấy thống kê tổng hợp về người dùng
     * @returns Thống kê tổng hợp về người dùng hoặc null nếu thất bại
     */
    async getUserStatistics(): Promise<UserStatisticsResponse | null> {
        logApiCall('getUserStatistics');
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<UserStatisticsResponse>>('/users/statistics');

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lấy thống kê người dùng", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy thống kê người dùng:", error);
            toast.error("Đã xảy ra lỗi khi lấy thống kê người dùng", { position: "top-right" });
            return null;
        }
    }

    /**
     * Lấy tổng số người dùng
     * @returns Tổng số người dùng hoặc 0 nếu thất bại
     */
    async getTotalUsers(): Promise<number> {
        logApiCall('getTotalUsers');
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<number>>('/users/statistics/total');

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lấy tổng số người dùng", { position: "top-right" });
                return 0;
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy tổng số người dùng:", error);
            return 0;
        }
    }

    /**
     * Lấy số người dùng mới trong ngày
     * @returns Số người dùng mới trong ngày hoặc 0 nếu thất bại
     */
    async getNewUsersToday(): Promise<number> {
        logApiCall('getNewUsersToday');
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<number>>('/users/statistics/today');

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lấy số người dùng mới trong ngày", { position: "top-right" });
                return 0;
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy số người dùng mới trong ngày:", error);
            return 0;
        }
    }
}

export default new UserStatisticsService();
