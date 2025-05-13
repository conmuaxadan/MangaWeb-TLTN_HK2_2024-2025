import { toast } from "react-toastify";
import { profileHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { UserProfileResponse } from "../interfaces/models/profile";
import { logApiCall } from "../utils/api-logger";

class ProfileService {
    /**
     * Lấy thông tin profile của người dùng hiện tại
     * @returns Thông tin profile hoặc null nếu thất bại
     */
    async getMyProfile(): Promise<UserProfileResponse | null> {
        logApiCall('getMyProfile');
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<UserProfileResponse>>('/profiles/me');

            if (apiResponse.code !== 1000) {
                console.error("Lấy thông tin profile thất bại:", apiResponse.message);
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy thông tin profile:", error);
            return null;
        }
    }

    /**
     * Lấy thông tin profile của người dùng theo ID
     * @param userId ID của người dùng
     * @returns Thông tin profile hoặc null nếu thất bại
     */
    async getProfileByUserId(userId: string): Promise<UserProfileResponse | null> {
        logApiCall('getProfileByUserId');
        try {
            const apiResponse = await profileHttpClient.get<ApiResponse<UserProfileResponse>>(`/profiles/by-user-id/${userId}`);

            if (apiResponse.code !== 1000) {
                console.error(`Lỗi lấy thông tin profile của người dùng ID ${userId}:`, apiResponse.message);
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
        logApiCall('updateProfile');
        try {
            const apiResponse = await profileHttpClient.put<ApiResponse<UserProfileResponse>>('/profiles/me', data);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể cập nhật thông tin profile", { position: "top-right" });
                return null;
            }

            toast.success("Cập nhật thông tin profile thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi cập nhật thông tin profile:", error);
            toast.error("Đã xảy ra lỗi khi cập nhật thông tin profile. Vui lòng thử lại sau.", { position: "top-right" });
            return null;
        }
    }

    /**
     * Cập nhật avatar
     * @param file File ảnh avatar
     * @returns Thông tin profile đã cập nhật hoặc null nếu thất bại
     */
    async updateAvatar(file: File): Promise<UserProfileResponse | null> {
        logApiCall('updateAvatar');
        try {
            const formData = new FormData();
            formData.append('image', file);

            const apiResponse = await profileHttpClient.post<ApiResponse<UserProfileResponse>>('/profiles/me/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể cập nhật avatar", { position: "top-right" });
                return null;
            }

            toast.success("Cập nhật avatar thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi cập nhật avatar:", error);
            toast.error("Đã xảy ra lỗi khi cập nhật avatar. Vui lòng thử lại sau.", { position: "top-right" });
            return null;
        }
    }
}

export default new ProfileService();
