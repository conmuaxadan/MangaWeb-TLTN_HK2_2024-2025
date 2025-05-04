import { toast } from "react-toastify";
import { profileHttpClient, identityHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { AxiosError } from "axios";
import {
    UserProfileResponse,
    UserProfileRequest,
    ReadingHistoryRequest,
    ReadingHistoryResponse,
    FavoriteMangaResponse,
    CommentRequest,
    CommentResponse,
    FavoriteRequest,
    CommentPageResponse,
    FavoritePageResponse,
    ReadingHistoryPageResponse,
    AnonymousReadingHistoryRequest,
    AnonymousReadingHistoryResponse
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
     * @returns true nếu upload thành công, false nếu thất bại
     */
    async uploadAvatar(file: File): Promise<boolean> {
        try {
            console.log('Uploading avatar...');

            const formData = new FormData();
            formData.append('file', file);

            // Gọi API cập nhật avatar
            const apiResponse = await profileHttpClient.post<ApiResponse<UserProfileResponse>>('/users/me/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Upload avatar response:', apiResponse);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể cập nhật ảnh đại diện", { position: "top-right" });
                return false;
            }

            toast.success("Cập nhật ảnh đại diện thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error("Lỗi cập nhật ảnh đại diện:", error);

            if (error instanceof AxiosError) {
                if (error.response) {
                    // Server trả về lỗi với status code khác 2xx
                    console.error('Error data:', error.response.data);
                    console.error('Error status:', error.response.status);
                    console.error('Error headers:', error.response.headers);

                    // Hiển thị thông báo lỗi cụ thể nếu có
                    const errorMessage = error.response.data?.message || "Không thể cập nhật ảnh đại diện";
                    toast.error(errorMessage, { position: "top-right" });
                } else {
                    toast.error("Không thể cập nhật ảnh đại diện", { position: "top-right" });
                }
            } else {
                toast.error("Không thể cập nhật ảnh đại diện", { position: "top-right" });
            }

            return false;
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
            console.log('Sending change password request to identity service:', '/users/change-password');
            console.log('Request data:', { oldPassword: '***', newPassword: '***' });

            // Sử dụng identityHttpClient thay vì profileHttpClient vì đổi mật khẩu là chức năng của identity service
            const apiResponse = await identityHttpClient.post<ApiResponse<void>>('/users/change-password', {
                oldPassword,
                newPassword
            });

            console.log('Change password response:', apiResponse);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể đổi mật khẩu", { position: "top-right" });
                return false;
            }

            toast.success("Đổi mật khẩu thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error("Lỗi đổi mật khẩu:", error);

            if (error instanceof AxiosError) {
                if (error.response) {
                    // Server trả về lỗi với status code khác 2xx
                    console.error('Error data:', error.response.data);
                    console.error('Error status:', error.response.status);
                    console.error('Error headers:', error.response.headers);

                    // Hiển thị thông báo lỗi cụ thể nếu có
                    const errorMessage = error.response.data?.message || "Không thể đổi mật khẩu";
                    toast.error(errorMessage, { position: "top-right" });
                } else {
                    toast.error("Không thể đổi mật khẩu", { position: "top-right" });
                }
            } else {
                toast.error("Không thể đổi mật khẩu", { position: "top-right" });
            }

            return false;
        }
    }

    /**
     * Lấy danh sách bình luận của người dùng hiện tại
     * @param page Số trang
     * @param size Số lượng bình luận trên mỗi trang
     * @returns Danh sách bình luận có phân trang hoặc null nếu thất bại
     */
    async getMyComments(page: number = 0, size: number = 20): Promise<ApiResponse<CommentPageResponse> | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<CommentPageResponse>>(
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
     * Cập nhật thông tin profile của người dùng hiện tại
     * @param request Thông tin cần cập nhật (displayName)
     * @returns true nếu cập nhật thành công, false nếu thất bại
     */
    async updateProfileInfo(request: { displayName: string }): Promise<boolean> {
        try {
            console.log('Sending update profile request:', request);

            const apiResponse = await profileHttpClient.put<ApiResponse<UserProfileResponse>>('/users/me', request);

            console.log('Update profile response:', apiResponse);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể cập nhật thông tin profile", { position: "top-right" });
                return false;
            }

            toast.success("Cập nhật thông tin profile thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi cập nhật thông tin profile:`, error);

            if (error instanceof AxiosError) {
                if (error.response) {
                    // Server trả về lỗi với status code khác 2xx
                    console.error('Error data:', error.response.data);
                    console.error('Error status:', error.response.status);
                    console.error('Error headers:', error.response.headers);

                    // Hiển thị thông báo lỗi cụ thể nếu có
                    const errorMessage = error.response.data?.message || "Không thể cập nhật thông tin profile";
                    toast.error(errorMessage, { position: "top-right" });
                } else {
                    toast.error("Không thể cập nhật thông tin profile", { position: "top-right" });
                }
            } else {
                toast.error("Không thể cập nhật thông tin profile", { position: "top-right" });
            }

            return false;
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
     * Lấy danh sách manga yêu thích của người dùng hiện tại
     * @returns Danh sách manga yêu thích hoặc null nếu thất bại
     */
    async getMyFavorites(): Promise<FavoriteMangaResponse[] | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<FavoritePageResponse>>(`/favorites?page=0&size=100&sort=createdAt,desc`);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lấy danh sách manga yêu thích", { position: "top-right" });
                return null;
            }

            // API trả về dạng Page, cần lấy phần content
            return apiResponse.result.content || [];
        } catch (error) {
            console.error(`Lỗi lấy danh sách manga yêu thích:`, error);
            return null;
        }
    }

    // Method removeFavorite has been moved to line 549

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
    async markChapterAsRead(userId: string, mangaId: string, chapterId: string): Promise<ReadingHistoryResponse | null> {
        try {
            const request: ReadingHistoryRequest = {
                mangaId,
                chapterId,
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
    async getLatestComments(limit: number = 10): Promise<ApiResponse<CommentPageResponse> | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<CommentPageResponse>>(
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
    async getCommentsByChapterId(chapterId: string, page: number = 0, size: number = 10): Promise<ApiResponse<CommentPageResponse> | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<CommentPageResponse>>(
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

    /**
     * Thêm manga vào danh sách yêu thích
     * @param mangaId ID của manga
     * @returns Thông tin manga đã thêm vào yêu thích hoặc null nếu thất bại
     */
    async addFavorite(mangaId: string): Promise<FavoriteMangaResponse | null> {
        try {
            const request: FavoriteRequest = { mangaId };
            const apiResponse = await profileHttpClient.post<ApiResponse<FavoriteMangaResponse>>('/favorites', request);

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể thêm vào danh sách yêu thích");
                return null;
            }

            toast.success("Đã thêm vào danh sách yêu thích", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi thêm manga ${mangaId} vào danh sách yêu thích:`, error);
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
        try {
            const apiResponse = await profileHttpClient.delete<ApiResponse<void>>(`/favorites/${mangaId}`);

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể xóa khỏi danh sách yêu thích");
                return false;
            }

            toast.success("Đã xóa khỏi danh sách yêu thích", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi xóa manga ${mangaId} khỏi danh sách yêu thích:`, error);
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
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<boolean>>(`/favorites/${mangaId}/check`);

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể kiểm tra trạng thái yêu thích");
                return false;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi kiểm tra trạng thái yêu thích của manga ${mangaId}:`, error);
            return false;
        }
    }

    /**
     * Lấy danh sách manga yêu thích của người dùng
     * @param page Số trang
     * @param size Số lượng manga trên mỗi trang
     * @returns Danh sách manga yêu thích có phân trang hoặc null nếu thất bại
     */
    async getFavorites(page: number = 0, size: number = 20): Promise<ApiResponse<FavoritePageResponse> | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<FavoritePageResponse>>(
                `/favorites?page=${page}&size=${size}&sort=createdAt,desc`
            );

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể lấy danh sách yêu thích");
                return null;
            }

            return apiResponse;
        } catch (error) {
            console.error(`Lỗi lấy danh sách manga yêu thích:`, error);
            return null;
        }
    }

    /**
     * Lấy lịch sử đọc của người dùng hiện tại
     * @returns Danh sách lịch sử đọc hoặc null nếu thất bại
     */
    async getMyReadingHistory(): Promise<ReadingHistoryResponse[] | null> {
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<ReadingHistoryPageResponse>>(`/reading-history?page=0&size=100&sort=updatedAt,desc`);

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
     * Xóa lịch sử đọc
     * @param historyId ID của lịch sử đọc
     * @returns true nếu xóa thành công, false nếu thất bại
     */
    async removeReadingHistory(historyId: string): Promise<boolean> {
        try {
            const apiResponse = await profileHttpClient.delete<ApiResponse<void>>(`/reading-history/${historyId}`);

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể xóa lịch sử đọc");
                return false;
            }

            toast.success("Đã xóa khỏi lịch sử đọc", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi xóa lịch sử đọc ${historyId}:`, error);
            toast.error("Không thể xóa lịch sử đọc", { position: "top-right" });
            return false;
        }
    }

    /**
     * Đánh dấu đã đọc chapter cho người dùng đã đăng nhập
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

            const apiResponse = await profileHttpClient.post<ApiResponse<ReadingHistoryResponse>>('/reading-history', request);

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

            const apiResponse = await profileHttpClient.post<ApiResponse<AnonymousReadingHistoryResponse>>('/anonymous-reading-history', request);

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể đánh dấu đã đọc chapter cho người dùng không đăng nhập");
                return null;
            }

            console.log('Lưu lịch sử đọc ẩn danh thành công:', apiResponse.result);
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi đánh dấu đã đọc chapter ${chapterId} của manga ${mangaId} cho người dùng không đăng nhập:`, error);
            return null;
        }
    }
}

export default new ProfileService();
