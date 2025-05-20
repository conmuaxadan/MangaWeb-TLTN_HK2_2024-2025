import { toast } from "react-toastify";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import {
    ReadingHistoryRequest,
    ReadingHistoryResponse,
    ReadingHistoryPageResponse,
    AnonymousReadingHistoryRequest,
    AnonymousReadingHistoryResponse
} from "../interfaces/models/reading-history";
import HttpClient from "./http-client";
import { API_CONFIG } from "../configurations/api-config";

// Create a dedicated HTTP client for history service
const historyHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}/history`);

class HistoryService {
    /**
     * Lấy lịch sử đọc của người dùng hiện tại
     * @returns Danh sách lịch sử đọc hoặc null nếu thất bại
     */
    async getMyReadingHistory(): Promise<ReadingHistoryResponse[] | null> {
        try {
            const apiResponse = await historyHttpClient.get<ApiResponse<ReadingHistoryPageResponse>>(
                `/reading-histories?page=0&size=100&sort=updatedAt,desc`
            );

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lấy lịch sử đọc", { position: "top-right" });
                return null;
            }

            // API trả về dạng Page, cần lấy phần content
            return apiResponse.result.content || [];
        } catch (error) {
            console.error(`Lỗi lấy lịch sử đọc:`, error);
            return null;
        }
    }

    /**
     * Lấy lịch sử đọc của người dùng cụ thể
     * @param userId ID của người dùng
     * @returns Danh sách lịch sử đọc hoặc null nếu thất bại
     */
    async getUserReadingHistory(userId: string): Promise<ReadingHistoryResponse[] | null> {
        try {
            const apiResponse = await historyHttpClient.get<ApiResponse<ReadingHistoryPageResponse>>(
                `/reading-histories/user/${userId}?page=0&size=100&sort=updatedAt,desc`
            );

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lấy lịch sử đọc", { position: "top-right" });
                return null;
            }

            return apiResponse.result.content || [];
        } catch (error) {
            console.error(`Lỗi lấy lịch sử đọc của người dùng ID ${userId}:`, error);
            return null;
        }
    }

    /**
     * Lấy thông tin lịch sử đọc của một manga cụ thể cho người dùng hiện tại
     * @param mangaId ID của manga
     * @returns Thông tin lịch sử đọc hoặc null nếu thất bại
     */
    async getMyMangaReadingHistory(mangaId: string): Promise<ReadingHistoryResponse | null> {
        try {
            const apiResponse = await historyHttpClient.get<ApiResponse<ReadingHistoryResponse>>(
                `/reading-histories/manga/${mangaId}`
            );

            if (apiResponse.code !== 1000) {
                // Không hiển thị toast vì có thể người dùng chưa đọc manga này
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy lịch sử đọc manga ID ${mangaId}:`, error);
            return null;
        }
    }

    /**
     * Lấy thông tin lịch sử đọc của một manga cụ thể cho người dùng cụ thể
     * @param userId ID của người dùng
     * @param mangaId ID của manga
     * @returns Thông tin lịch sử đọc hoặc null nếu thất bại
     */
    async getUserMangaReadingHistory(userId: string, mangaId: string): Promise<ReadingHistoryResponse | null> {
        try {
            const apiResponse = await historyHttpClient.get<ApiResponse<ReadingHistoryResponse>>(
                `/reading-histories/user/${userId}/manga/${mangaId}`
            );

            if (apiResponse.code !== 1000) {
                // Không hiển thị toast vì có thể người dùng chưa đọc manga này
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy lịch sử đọc manga ID ${mangaId} của người dùng ID ${userId}:`, error);
            return null;
        }
    }

    /**
     * Đánh dấu đã đọc chapter cho người dùng hiện tại
     * @param mangaId ID của manga
     * @param chapterId ID của chapter
     * @returns Thông tin lịch sử đọc hoặc null nếu thất bại
     */
    async markAsRead(mangaId: string, chapterId: string): Promise<ReadingHistoryResponse | null> {
        try {
            const request: ReadingHistoryRequest = {
                mangaId,
                chapterId
            };

            console.log('Sending reading history request:', request);

            const apiResponse = await historyHttpClient.post<ApiResponse<ReadingHistoryResponse>>(
                '/reading-histories',
                request
            );

            if (apiResponse.code !== 1000) {
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
     * Đánh dấu đã đọc chapter cho người dùng cụ thể
     * @param userId ID của người dùng
     * @param mangaId ID của manga
     * @param chapterId ID của chapter
     * @returns Thông tin lịch sử đọc hoặc null nếu thất bại
     */
    async markUserChapterAsRead(userId: string, mangaId: string, chapterId: string): Promise<ReadingHistoryResponse | null> {
        try {
            const request: ReadingHistoryRequest = {
                mangaId,
                chapterId,
            };

            const apiResponse = await historyHttpClient.post<ApiResponse<ReadingHistoryResponse>>(
                `/reading-histories/user/${userId}`,
                request
            );

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể đánh dấu đã đọc chapter");
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi đánh dấu đã đọc chapter ID ${chapterId} của manga ID ${mangaId}:`, error);
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
    async markAnonymousRead(mangaId: string, chapterId: string, sessionId: string): Promise<AnonymousReadingHistoryResponse | null> {
        try {
            if (!mangaId || !chapterId || !sessionId) {
                console.error('Thiếu thông tin để đánh dấu đã đọc chapter cho người dùng không đăng nhập');
                console.log('mangaId:', mangaId, 'chapterId:', chapterId, 'sessionId:', sessionId);
                return null;
            }

            const request: AnonymousReadingHistoryRequest = {
                mangaId,
                chapterId,
                sessionId
            };

            console.log('Sending anonymous reading history request:', request);
            console.log('API endpoint:', `${API_CONFIG.BASE_URL}/history/anonymous-reading-histories`);

            let apiResponse;
            try {
                apiResponse = await historyHttpClient.post<ApiResponse<AnonymousReadingHistoryResponse>>(
                    '/anonymous-reading-histories',
                    request
                );

                console.log('Anonymous reading history API response:', apiResponse);

                if (apiResponse.code !== 1000) {
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

    /**
     * Lấy lịch sử đọc của phiên không đăng nhập
     * @param sessionId ID phiên của người dùng
     * @returns Danh sách lịch sử đọc hoặc null nếu thất bại
     */
    async getAnonymousReadingHistory(sessionId: string): Promise<AnonymousReadingHistoryResponse[] | null> {
        try {
            const apiResponse = await historyHttpClient.get<ApiResponse<Page<AnonymousReadingHistoryResponse>>>(
                `/anonymous-reading-histories/session/${sessionId}?page=0&size=100&sort=updatedAt,desc`
            );

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể lấy lịch sử đọc ẩn danh");
                return null;
            }

            return apiResponse.result.content || [];
        } catch (error) {
            console.error(`Lỗi lấy lịch sử đọc ẩn danh cho phiên ${sessionId}:`, error);
            return null;
        }
    }
}

// Tạo một instance của HistoryService
const historyService = new HistoryService();
export default historyService;

// Định nghĩa kiểu Page cho TypeScript
interface Page<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}
