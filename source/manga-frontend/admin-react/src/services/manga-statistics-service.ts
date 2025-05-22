import { toast } from "react-toastify";
import { mangaHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { logApiCall } from "../utils/api-logger";

// Interface cho truyện được xem nhiều nhất
export interface MostViewedMangaResponse {
    id: string;
    title: string;
    views: number;
    author: string;
    mainGenre: string;
}

class MangaStatisticsService {
    /**
     * Lấy danh sách truyện được xem nhiều nhất
     * @param limit Số lượng truyện cần lấy (mặc định là 10)
     * @returns Danh sách truyện được xem nhiều nhất hoặc null nếu thất bại
     */
    async getMostViewedMangas(limit: number = 10): Promise<MostViewedMangaResponse[] | null> {
        logApiCall('getMostViewedMangas');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<MostViewedMangaResponse[]>>(`/mangas/most-viewed?limit=${limit}`);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lấy danh sách truyện được xem nhiều nhất", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách truyện được xem nhiều nhất:", error);
            toast.error("Đã xảy ra lỗi khi lấy danh sách truyện được xem nhiều nhất", { position: "top-right" });
            return null;
        }
    }
}

export default new MangaStatisticsService();
