import { toast } from "react-toastify";
import { profileHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import {
    UserProfileResponse,
    UserProfileRequest,
    ReadingHistoryRequest,
    ReadingHistoryResponse,
    FavoriteMangaResponse
} from "../interfaces/models/profile";

class ProfileService {
    /**
     * Lấy thông tin profile của người dùng
     * @param userId ID của người dùng
     * @returns Thông tin profile hoặc null nếu thất bại
     */
    async getUserProfile(userId: string): Promise<UserProfileResponse | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<UserProfileResponse>>(`/users/${userId}`);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lấy thông tin profile", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin profile của người dùng ID ${userId}:`, error);
            return null;
        }
    }

    /**
     * Cập nhật thông tin profile của người dùng
     * @param request Thông tin profile cần cập nhật
     * @returns Thông tin profile đã cập nhật hoặc null nếu thất bại
     */
    async updateUserProfile(request: UserProfileRequest): Promise<UserProfileResponse | null> {
        try {
            const apiResponse = await profileHttpClient.put<ApiResponse<UserProfileResponse>>(`/users/${request.userId}`, request);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể cập nhật thông tin profile", { position: "top-right" });
                return null;
            }

            toast.success("Cập nhật thông tin profile thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi cập nhật thông tin profile của người dùng ID ${request.userId}:`, error);
            return null;
        }
    }

    /**
     * Lấy lịch sử đọc của người dùng
     * @param userId ID của người dùng
     * @returns Danh sách lịch sử đọc hoặc null nếu thất bại
     */
    async getReadingHistory(userId: string): Promise<ReadingHistoryResponse[] | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<ReadingHistoryResponse[]>>(`/users/${userId}/reading-history`);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lấy lịch sử đọc", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy lịch sử đọc của người dùng ID ${userId}:`, error);
            return null;
        }
    }

    /**
     * Lấy thông tin lịch sử đọc của một manga cụ thể
     * @param userId ID của người dùng
     * @param mangaId ID của manga
     * @returns Thông tin lịch sử đọc hoặc null nếu thất bại
     */
    async getMangaReadingHistory(userId: string, mangaId: string): Promise<ReadingHistoryResponse | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<ReadingHistoryResponse>>(
                `/users/${userId}/reading-history/manga/${mangaId}`
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
     * Lấy danh sách manga yêu thích của người dùng
     * @param userId ID của người dùng
     * @returns Danh sách manga yêu thích hoặc null nếu thất bại
     */
    async getFavoriteMangas(userId: string): Promise<FavoriteMangaResponse[] | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<FavoriteMangaResponse[]>>(`/users/${userId}/favorites`);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lấy danh sách manga yêu thích", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy danh sách manga yêu thích của người dùng ID ${userId}:`, error);
            return null;
        }
    }

    /**
     * Kiểm tra xem một manga có nằm trong danh sách yêu thích không
     * @param userId ID của người dùng
     * @param mangaId ID của manga
     * @returns true nếu manga nằm trong danh sách yêu thích, false nếu không
     */
    async isMangaFavorite(userId: string, mangaId: string): Promise<boolean> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<boolean>>(`/users/${userId}/favorites/manga/${mangaId}`);

            if (apiResponse.code !== 1000) {
                return false;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi kiểm tra manga yêu thích ID ${mangaId} của người dùng ID ${userId}:`, error);
            return false;
        }
    }

    /**
     * Đánh dấu đã đọc chapter
     * @param userId ID của người dùng
     * @param mangaId ID của manga
     * @param chapterId ID của chapter
     * @param lastPageRead Trang cuối cùng đã đọc
     * @returns Thông tin lịch sử đọc hoặc null nếu thất bại
     */
    async markChapterAsRead(userId: string, mangaId: string, chapterId: string, lastPageRead: number): Promise<ReadingHistoryResponse | null> {
        try {
            const request: ReadingHistoryRequest = {
                mangaId,
                chapterId,
                lastPageRead
            };

            const apiResponse = await profileHttpClient.post<ApiResponse<ReadingHistoryResponse>>(
                `/users/${userId}/reading-history`,
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
     * Thêm/xóa manga khỏi danh sách yêu thích
     * @param userId ID của người dùng
     * @param mangaId ID của manga
     * @returns true nếu thêm vào danh sách yêu thích, false nếu xóa khỏi danh sách yêu thích
     */
    async toggleFavoriteManga(userId: string, mangaId: string): Promise<boolean> {
        try {
            // Kiểm tra trạng thái hiện tại
            const isFavorite = await this.isMangaFavorite(userId, mangaId);

            if (isFavorite) {
                // Xóa khỏi danh sách yêu thích
                const deleteResponse = await profileHttpClient.delete<ApiResponse<void>>(`/users/${userId}/favorites/manga/${mangaId}`);
                if (deleteResponse.code === 1000) {
                    toast.success("Xóa khỏi danh sách yêu thích thành công", { position: "top-right" });
                }
                return false;
            } else {
                // Thêm vào danh sách yêu thích
                const addResponse = await profileHttpClient.post<ApiResponse<FavoriteMangaResponse>>(`/users/${userId}/favorites/manga/${mangaId}`, {});
                if (addResponse.code === 1000) {
                    toast.success("Thêm vào danh sách yêu thích thành công", { position: "top-right" });
                }
                return true;
            }
        } catch (error) {
            console.error(`Lỗi thay đổi trạng thái yêu thích manga ID ${mangaId}:`, error);
            toast.error("Không thể thay đổi trạng thái yêu thích", { position: "top-right" });
            return await this.isMangaFavorite(userId, mangaId);
        }
    }
}

export default new ProfileService();
