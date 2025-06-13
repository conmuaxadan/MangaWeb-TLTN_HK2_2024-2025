import { toast } from "react-toastify";
import { identityHttpClient } from "./http-client.js";
import { logApiCall } from "../utils/api-logger.js";

class UserService {
    /**
     * Lấy thông tin người dùng theo user ID từ identity service
     * @param userId ID của người dùng
     * @returns Thông tin người dùng hoặc null nếu thất bại
     */
    async getUserById(userId) {
        logApiCall('getUserById');
        try {
            const apiResponse = await identityHttpClient.get(`/users/${userId}`);

            if (apiResponse.code !== 200) {
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
    async updateProfile(displayName) {
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

            const request = { displayName };
            await identityHttpClient.put('/users/me', request);
            toast.success("Cập nhật tên hiển thị thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error("Lỗi cập nhật tên hiển thị:", error);

            if (error.response) {
                const apiResponse = error.response.data;
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
    async uploadAvatar(file) {
        try {
            console.log('Uploading avatar...');

            const formData = new FormData();
            formData.append('image', file);

            // Gọi API cập nhật avatar từ identity service
            const apiResponse = await identityHttpClient.put('/users/me/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Upload avatar response:', apiResponse);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể cập nhật ảnh đại diện", { position: "top-right" });
                return false;
            }

            toast.success("Cập nhật ảnh đại diện thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error("Lỗi cập nhật ảnh đại diện:", error);
            toast.error("Không thể cập nhật ảnh đại diện", { position: "top-right" });
            return false;
        }
    }

    /**
     * Đổi mật khẩu
     * @param oldPassword Mật khẩu cũ
     * @param newPassword Mật khẩu mới
     * @returns true nếu đổi mật khẩu thành công, false nếu thất bại
     */
    async changePassword(oldPassword, newPassword) {
        try {
            console.log('Sending change password request to identity service:', '/users/me/password');
            console.log('Request data:', { oldPassword, newPassword });

            const request = {
                oldPassword,
                newPassword
            };
            const apiResponse = await identityHttpClient.put('/users/me/password', request);

            console.log('Change password response:', apiResponse);

            if (apiResponse.code !== 200) {
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
}

const userService = new UserService();
export default userService;
