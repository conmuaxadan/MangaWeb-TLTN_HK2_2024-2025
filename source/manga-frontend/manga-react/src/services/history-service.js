import {toast} from "react-toastify";
import HttpClient from "./http-client.js";
import {API_CONFIG} from "../configurations/api-config.js";

// Create a dedicated HTTP client for history service
const historyHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}/history`);

class HistoryService {
    /**
     * Lấy lịch sử đọc của người dùng hiện tại
     * @param page Số trang
     * @param size Số lượng item mỗi trang
     * @returns Danh sách lịch sử đọc có phân trang hoặc null nếu thất bại
     */
    async getMyReadingHistory(page = 0, size = 18) {
        try {
            const apiResponse = await historyHttpClient.get(
                `/histories?page=${page}&size=${size}&sort=updatedAt,desc`
            );

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy lịch sử đọc", {position: "top-right"});
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy lịch sử đọc:`, error);
            return null;
        }
    }

    /**
     * Lấy lịch sử đọc của người dùng hiện tại (phương thức cũ để tương thích)
     * @returns Danh sách lịch sử đọc hoặc null nếu thất bại
     */
    async getMyReadingHistoryLegacy() {
        try {
            const result = await this.getMyReadingHistory(0, 100);
            return result?.content || null;
        } catch (error) {
            console.error(`Lỗi lấy lịch sử đọc (legacy):`, error);
            return null;
        }
    }

    /**
     * Đánh dấu đã đọc chapter cho người dùng hiện tại
     * @param mangaId ID của manga
     * @param chapterId ID của chapter
     * @returns Thông tin lịch sử đọc hoặc null nếu thất bại
     */
    async markAsRead(mangaId, chapterId) {
        try {
            const request = {
                mangaId,
                chapterId
            };

            console.log('Sending reading history request:', request);

            const apiResponse = await historyHttpClient.post(
                '/histories',
                request
            );

            if (apiResponse.code !== 201) {
                console.error(apiResponse.message || "Không thể đánh dấu đã đọc chapter");
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi đánh dấu đã đọc chapter ${chapterId} của manga ${mangaId}:`, error);
            return null;
        }
    }

    /**
     * Đánh dấu đã đọc chapter cho người dùng không đăng nhập
     * @param mangaId ID của manga
     * @param chapterId ID của chapter
     * @param sessionId ID phiên của người dùng
     * @returns Thông tin lịch sử đọc hoặc null nếu thất bại
     */
    async markAnonymousRead(mangaId, chapterId, sessionId) {
        try {
            if (!mangaId || !chapterId || !sessionId) {
                console.error('Thiếu thông tin để đánh dấu đã đọc chapter cho người dùng không đăng nhập');
                console.log('mangaId:', mangaId, 'chapterId:', chapterId, 'sessionId:', sessionId);
                return null;
            }

            const request = {
                mangaId,
                chapterId,
                sessionId
            };

            console.log('Sending anonymous reading history request:', request);
            console.log('API endpoint:', `${API_CONFIG.BASE_URL}/history/anonymous-histories`);

            let apiResponse;
            try {
                apiResponse = await historyHttpClient.post(
                    '/anonymous-histories',
                    request
                );

                console.log('Anonymous reading history API response:', apiResponse);

                if (apiResponse.code !== 201) {
                    console.error(apiResponse.message || "Không thể đánh dấu đã đọc chapter cho người dùng không đăng nhập");
                    return null;
                }

                console.log('Lưu lịch sử đọc ẩn danh thành công:', apiResponse.result);
                return apiResponse.result;
            } catch (apiError) {
                console.error('API error when sending anonymous reading history:', apiError);
                return null;
            }
        } catch (error) {
            console.error(`Lỗi đánh dấu đã đọc chapter ${chapterId} của manga ${mangaId} cho phiên ${sessionId}:`, error);
            return null;
        }
    }
}

const historyService = new HistoryService();
export default historyService;
