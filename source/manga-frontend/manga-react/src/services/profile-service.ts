import { toast } from "react-toastify";
import { identityHttpClient, commentHttpClient} from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { AxiosError } from "axios";
import { UserResponse, ChangeDisplayNameRequest, ChangePasswordRequest } from "../interfaces/models/user";
import { logApiCall } from "../utils/api-logger";

class ProfileService {

    /**
     * Lấy thông tin người dùng theo user ID từ identity service
     * @param userId ID của người dùng
     * @returns Thông tin người dùng hoặc null nếu thất bại
     */
    async getUserById(userId: string): Promise<UserResponse | null> {
        logApiCall('getUserById');
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<UserResponse>>(`/users/id/${userId}`);

            if (apiResponse.code !== 1000) {
                // Không hiển thị thông báo lỗi vì đây là tính năng ngầm
                console.error(`Lỗi lấy thông tin người dùng: ${apiResponse.message}`);
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin người dùng ID ${userId}:`, error);
            // Không hiển thị thông báo lỗi vì đây là tính năng ngầm
            return null;
        }
    }


    /**
     * Cập nhật tên hiển thị của người dùng
     * @param displayName Tên hiển thị mới
     * @returns true nếu cập nhật thành công, false nếu thất bại
     */
    async updateProfile(displayName: string): Promise<boolean> {
        logApiCall('updateProfile');
        try {
            // Kiểm tra độ dài của displayName
            if (!displayName || displayName.trim().length < 6) {
                toast.error("Tên hiển thị phải có ít nhất 6 ký tự", { position: "top-right" });
                return false;
            }

            if (displayName.length > 16) {
                toast.error("Tên hiển thị không được vượt quá 16 ký tự", { position: "top-right" });
                return false;
            }

            // Sử dụng DTO để gửi request
            const request: ChangeDisplayNameRequest = { displayName };
            const apiResponse = await identityHttpClient.put<ApiResponse<UserResponse>>('/users/me', request);

            if (apiResponse.code !== 1000) {
                // Xử lý các mã lỗi cụ thể
                if (apiResponse.code === 1108) {
                    toast.error("Tên hiển thị đã tồn tại", { position: "top-right" });
                } else if (apiResponse.code === 1111) {
                    toast.error("Tên hiển thị phải có ít nhất 6 ký tự", { position: "top-right" });
                } else if (apiResponse.code === 1112) {
                    toast.error("Tên hiển thị không được vượt quá 16 ký tự", { position: "top-right" });
                } else {
                    toast.error(apiResponse.message || "Không thể cập nhật tên hiển thị", { position: "top-right" });
                }
                return false;
            }

            toast.success("Cập nhật tên hiển thị thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error("Lỗi cập nhật tên hiển thị:", error);

            if (error instanceof AxiosError && error.response) {
                const apiResponse = error.response.data as ApiResponse<any>;
                if (apiResponse.code === 1108) {
                    toast.error("Tên hiển thị đã tồn tại", { position: "top-right" });
                } else if (apiResponse.code === 1111) {
                    toast.error("Tên hiển thị phải có ít nhất 6 ký tự", { position: "top-right" });
                } else if (apiResponse.code === 1112) {
                    toast.error("Tên hiển thị không được vượt quá 16 ký tự", { position: "top-right" });
                } else {
                    toast.error(apiResponse.message || "Không thể cập nhật tên hiển thị", { position: "top-right" });
                }
            } else {
                toast.error("Không thể cập nhật tên hiển thị", { position: "top-right" });
            }

            return false;
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
            formData.append('image', file);

            // Gọi API cập nhật avatar từ identity service
            const apiResponse = await identityHttpClient.post<ApiResponse<UserResponse>>('/users/me/avatar', formData, {
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

            // Sử dụng DTO để gửi request
            const request: ChangePasswordRequest = {
                oldPassword,
                newPassword
            };
            const apiResponse = await identityHttpClient.post<ApiResponse<void>>('/users/password', request);

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
     * Đếm số bình luận của một manga
     * @param mangaId ID của manga
     * @returns Tổng số bình luận hoặc 0 nếu thất bại
     */
    async countCommentsByMangaId(mangaId: string): Promise<number> {
        try {
            const apiResponse = await commentHttpClient.get<ApiResponse<number>>(`/comments/mangas/${mangaId}/count`);

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
}

// Tạo một instance của ProfileService
const profileService = new ProfileService();
export default profileService;
