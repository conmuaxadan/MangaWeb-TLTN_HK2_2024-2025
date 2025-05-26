import { toast } from "react-toastify";
import { favoriteHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import {
    FavoriteRequest,
    FavoriteResponse,
    FavoritePageResponse
} from "../interfaces/models/favorite";
import { logApiCall } from "../utils/api-logger";

class FavoriteService {
    /**
     * Thêm manga vào danh sách yêu thích
     * @param mangaId ID của manga
     * @returns Thông tin manga đã thêm vào yêu thích hoặc null nếu thất bại
     */
    async addFavorite(mangaId: string): Promise<FavoriteResponse | null> {
        logApiCall('addFavorite');
        try {
            const request: FavoriteRequest = {
                mangaId
            };

            const apiResponse = await favoriteHttpClient.post<ApiResponse<FavoriteResponse>>('/favorites', request);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể thêm vào danh sách yêu thích", { position: "top-right" });
                return null;
            }

            toast.success("Đã thêm vào danh sách yêu thích", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi thêm manga ID ${mangaId} vào danh sách yêu thích:`, error);
            toast.error("Không thể thêm vào danh sách yêu thích", { position: "top-right" });
            return null;
        }
    }

    /**
     * Xóa manga khỏi danh sách yêu thích
     * @param mangaId ID của manga
     * @returns true nếu xóa thành công, false nếu thất bại
     */
    async removeFavorite(mangaId: string): Promise<boolean> {
        logApiCall('removeFavorite');
        try {
            const apiResponse = await favoriteHttpClient.delete<ApiResponse<void>>(`/favorites/${mangaId}`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể xóa khỏi danh sách yêu thích", { position: "top-right" });
                return false;
            }

            toast.success("Đã xóa khỏi danh sách yêu thích", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi xóa manga ID ${mangaId} khỏi danh sách yêu thích:`, error);
            toast.error("Không thể xóa khỏi danh sách yêu thích", { position: "top-right" });
            return false;
        }
    }

    /**
     * Kiểm tra xem manga có trong danh sách yêu thích không
     * @param mangaId ID của manga
     * @returns true nếu manga có trong danh sách yêu thích, false nếu không
     */
    async isFavorite(mangaId: string): Promise<boolean> {
        logApiCall('isFavorite');
        try {
            const apiResponse = await favoriteHttpClient.get<ApiResponse<boolean>>(`/favorites/${mangaId}/check`);

            if (apiResponse.code !== 200) {
                console.error(apiResponse.message || "Không thể kiểm tra trạng thái yêu thích");
                return false;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi kiểm tra trạng thái yêu thích của manga ID ${mangaId}:`, error);
            return false;
        }
    }

    /**
     * Lấy danh sách manga yêu thích của người dùng hiện tại
     * @param page Số trang
     * @param size Số lượng manga mỗi trang
     * @returns Danh sách manga yêu thích có phân trang hoặc null nếu thất bại
     */
    async getFavorites(page: number = 0, size: number = 10): Promise<FavoritePageResponse | null> {
        logApiCall('getFavorites');
        try {
            const apiResponse = await favoriteHttpClient.get<ApiResponse<FavoritePageResponse>>(
                `/favorites?page=${page}&size=${size}&sort=createdAt,desc`
            );

            if (apiResponse.code !== 200) {
                console.error(apiResponse.message || "Không thể lấy danh sách manga yêu thích");
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy danh sách manga yêu thích:`, error);
            return null;
        }
    }

    /**
     * Đếm số lượng yêu thích của một manga
     * @param mangaId ID của manga
     * @returns Số lượng yêu thích hoặc 0 nếu thất bại
     */
    async countFavorites(mangaId: string): Promise<number> {
        logApiCall('countFavorites');
        try {
            const apiResponse = await favoriteHttpClient.get<ApiResponse<number>>(`/favorites/${mangaId}/count`);

            if (apiResponse.code !== 200) {
                console.error(`Lỗi đếm số lượng yêu thích của manga ID ${mangaId}:`, apiResponse.message);
                return 0;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi đếm số lượng yêu thích của manga ID ${mangaId}:`, error);
            return 0;
        }
    }

    /**
     * Thêm/xóa manga khỏi danh sách yêu thích
     * @param mangaId ID của manga
     * @returns true nếu thêm vào danh sách yêu thích, false nếu xóa khỏi danh sách yêu thích
     */
    async toggleFavorite(mangaId: string): Promise<boolean> {
        logApiCall('toggleFavorite');
        try {
            // Kiểm tra trạng thái hiện tại
            const isFavorite = await this.isFavorite(mangaId);

            if (isFavorite) {
                // Xóa khỏi danh sách yêu thích
                await this.removeFavorite(mangaId);
                return false;
            } else {
                // Thêm vào danh sách yêu thích
                await this.addFavorite(mangaId);
                return true;
            }
        } catch (error) {
            console.error(`Lỗi thay đổi trạng thái yêu thích manga ID ${mangaId}:`, error);
            toast.error("Không thể thay đổi trạng thái yêu thích", { position: "top-right" });
            return await this.isFavorite(mangaId);
        }
    }
}

// Tạo một instance của FavoriteService
const favoriteService = new FavoriteService();
export default favoriteService;
