import { toast } from "react-toastify";
import { profileHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import {
    UserProfileResponse,
    UserProfileRequest,
    ReadingHistoryRequest,
    ReadingHistoryResponse,
    FavoriteMangaResponse,
    CommentRequest,
    CommentResponse
} from "../interfaces/models/profile";

class ProfileService {
    /**
     * Lấy thông tin profile của người dùng theo profile ID
     * @param profileId ID của profile
     * @returns Thông tin profile hoặc null nếu thất bại
     */
    async getUserProfile(profileId: string): Promise<UserProfileResponse | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<UserProfileResponse>>(`/users/${profileId}`);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lấy thông tin profile", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin profile ID ${profileId}:`, error);
            return null;
        }
    }

    /**
     * Lấy thông tin profile của người dùng theo user ID
     * @param userId ID của người dùng (từ identity service)
     * @returns Thông tin profile hoặc null nếu thất bại
     */
    async getUserProfileByUserId(userId: string): Promise<UserProfileResponse | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<UserProfileResponse>>(`/users/by-user-id/${userId}`);

            if (apiResponse.code !== 1000) {
                // Không hiển thị thông báo lỗi vì đây là tính năng ngầm
                console.error(`Lỗi lấy thông tin profile: ${apiResponse.message}`);
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin profile của người dùng ID ${userId}:`, error);
            // Không hiển thị thông báo lỗi vì đây là tính năng ngầm
            return null;
        }
    }

    /**
     * Cập nhật thông tin profile
     * @param data Thông tin cần cập nhật
     * @returns Thông tin profile đã cập nhật hoặc null nếu thất bại
     */
    async updateProfile(data: { displayName: string }): Promise<UserProfileResponse | null> {
        try {
            const apiResponse = await profileHttpClient.put<ApiResponse<UserProfileResponse>>('/users/me', data);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể cập nhật thông tin profile", { position: "top-right" });
                return null;
            }

            toast.success("Cập nhật thông tin thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi cập nhật thông tin profile:", error);
            toast.error("Không thể cập nhật thông tin profile", { position: "top-right" });
            return null;
        }
    }

    /**
     * Upload avatar
     * @param file File ảnh avatar
     * @returns URL của avatar hoặc null nếu thất bại
     */
    async uploadAvatar(file: File): Promise<string | null> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const apiResponse = await profileHttpClient.post<ApiResponse<{ url: string }>>('/users/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể upload avatar", { position: "top-right" });
                return null;
            }

            toast.success("Upload avatar thành công", { position: "top-right" });
            return apiResponse.result.url;
        } catch (error) {
            console.error("Lỗi upload avatar:", error);
            toast.error("Không thể upload avatar", { position: "top-right" });
            return null;
        }
    }

    /**
     * Đổi mật khẩu
     * @param oldPassword Mật khẩu cũ
     * @param newPassword Mật khẩu mới
     * @returns true nếu đổi mật khẩu thành công, false nếu thất bại
     */
    async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
        try {
            const apiResponse = await profileHttpClient.post<ApiResponse<void>>('/users/change-password', {
                oldPassword,
                newPassword
            });

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể đổi mật khẩu", { position: "top-right" });
                return false;
            }

            toast.success("Đổi mật khẩu thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error("Lỗi đổi mật khẩu:", error);
            toast.error("Không thể đổi mật khẩu", { position: "top-right" });
            return false;
        }
    }

    /**
     * Lấy danh sách bình luận của người dùng hiện tại
     * @param page Số trang
     * @param size Số lượng bình luận trên mỗi trang
     * @returns Danh sách bình luận có phân trang hoặc null nếu thất bại
     */
    async getMyComments(page: number = 0, size: number = 20): Promise<ApiResponse<any> | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<any>>(
                `/comments/me?page=${page}&size=${size}&sort=createdAt,desc`
            );

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể lấy danh sách bình luận");
                return null;
            }

            return apiResponse;
        } catch (error) {
            console.error(`Lỗi lấy danh sách bình luận của tôi:`, error);
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

    /**
     * Lấy danh sách bình luận mới nhất
     * @param limit Số lượng bình luận cần lấy
     * @returns Danh sách bình luận mới nhất hoặc null nếu thất bại
     */
    async getLatestComments(limit: number = 10): Promise<ApiResponse<any> | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<any>>(
                `/comments/latest?size=${limit}&sort=createdAt,desc`
            );

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể lấy danh sách bình luận mới nhất");
                return null;
            }

            return apiResponse;
        } catch (error) {
            console.error(`Lỗi lấy danh sách bình luận mới nhất:`, error);
            return null;
        }
    }

    /**
     * Đếm số bình luận của một manga
     * @param mangaId ID của manga
     * @returns Tổng số bình luận hoặc 0 nếu thất bại
     */
    async countCommentsByMangaId(mangaId: string): Promise<number> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<number>>(`/comments/count/manga/${mangaId}`);

            if (apiResponse.code !== 1000) {
                console.error(`Lỗi đếm bình luận của manga ID ${mangaId}:`, apiResponse.message);
                return 0;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi đếm bình luận của manga ID ${mangaId}:`, error);
            return 0;
        }
    }

    /**
     * Lấy danh sách bình luận của một chapter
     * @param chapterId ID của chapter
     * @param page Số trang
     * @param size Số lượng bình luận trên mỗi trang
     * @returns Danh sách bình luận có phân trang hoặc null nếu thất bại
     */
    async getCommentsByChapterId(chapterId: string, page: number = 0, size: number = 10): Promise<ApiResponse<any> | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<any>>(
                `/comments/chapter/${chapterId}?page=${page}&size=${size}&sort=createdAt,desc`
            );

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể lấy danh sách bình luận");
                return null;
            }

            return apiResponse;
        } catch (error) {
            console.error(`Lỗi lấy danh sách bình luận của chapter ID ${chapterId}:`, error);
            return null;
        }
    }

    /**
     * Tạo bình luận mới
     * @param request Thông tin bình luận
     * @returns Thông tin bình luận đã tạo hoặc null nếu thất bại
     */
    async createComment(request: CommentRequest): Promise<CommentResponse | null> {
        try {
            const apiResponse = await profileHttpClient.post<ApiResponse<CommentResponse>>(
                '/comments',
                request
            );

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể tạo bình luận", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi tạo bình luận:`, error);
            toast.error("Không thể tạo bình luận. Vui lòng đăng nhập để bình luận.", { position: "top-right" });
            return null;
        }
    }

    /**
     * Xóa bình luận
     * @param commentId ID của bình luận
     * @returns true nếu xóa thành công, false nếu thất bại
     */
    async deleteComment(commentId: string): Promise<boolean> {
        try {
            const apiResponse = await profileHttpClient.delete<ApiResponse<void>>(`/comments/${commentId}`);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể xóa bình luận", { position: "top-right" });
                return false;
            }

            toast.success("Xóa bình luận thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi xóa bình luận ID ${commentId}:`, error);
            toast.error("Không thể xóa bình luận", { position: "top-right" });
            return false;
        }
    }

    /**
     * Cập nhật bình luận
     * @param commentId ID của bình luận
     * @param content Nội dung mới
     * @returns Thông tin bình luận đã cập nhật hoặc null nếu thất bại
     */
    async updateComment(commentId: string, content: string): Promise<CommentResponse | null> {
        try {
            const apiResponse = await profileHttpClient.put<ApiResponse<CommentResponse>>(
                `/comments/${commentId}`,
                content
            );

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể cập nhật bình luận", { position: "top-right" });
                return null;
            }

            toast.success("Cập nhật bình luận thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi cập nhật bình luận ID ${commentId}:`, error);
            toast.error("Không thể cập nhật bình luận", { position: "top-right" });
            return null;
        }
    }
}

export default new ProfileService();
