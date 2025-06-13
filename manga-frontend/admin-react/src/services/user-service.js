import { toast } from "react-toastify";
import { identityHttpClient } from "./http-client.js";
import { logApiCall } from "../utils/api-logger.js";

class UserService {
    async getAllUsers() {
        logApiCall('getAllUsers');
        try {
            const apiResponse = await identityHttpClient.get('/users');
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách người dùng", { position: "top-right" });
                return null;
            }
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách người dùng:", error);
            toast.error("Đã xảy ra lỗi khi lấy danh sách người dùng", { position: "top-right" });
            return null;
        }
    }

    async getUsersPaginated(page = 0, size = 10, sort = 'username', search) {
        logApiCall('getUsersPaginated');
        try {
            let url = `/users/paginated?page=${page}&size=${size}&sort=${sort}`;
            if (search && search.trim() !== '') {
                url += `&search=${encodeURIComponent(search)}`;
            }
            const apiResponse = await identityHttpClient.get(url);
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách người dùng", { position: "top-right" });
                return null;
            }
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách người dùng phân trang:", error);
            toast.error("Đã xảy ra lỗi khi lấy danh sách người dùng", { position: "top-right" });
            return null;
        }
    }

    async getUserByUsername(username) {
        logApiCall('getUserByUsername');
        try {
            const apiResponse = await identityHttpClient.get(`/users/${username}`);
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy thông tin người dùng", { position: "top-right" });
                return null;
            }
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin người dùng ${username}:`, error);
            toast.error("Đã xảy ra lỗi khi lấy thông tin người dùng", { position: "top-right" });
            return null;
        }
    }

    async createUser(request) {
        logApiCall('createUser');
        try {
            const apiResponse = await identityHttpClient.post('/users', request);
            if (apiResponse.code !== 201) {
                toast.error(apiResponse.message || "Không thể tạo người dùng", { position: "top-right" });
                return null;
            }
            toast.success("Tạo người dùng thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi tạo người dùng:", error);
            toast.error("Đã xảy ra lỗi khi tạo người dùng", { position: "top-right" });
            return null;
        }
    }

    async updateUser(request) {
        logApiCall('updateUser');
        try {
            const apiResponse = await identityHttpClient.put('/users', request);
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể cập nhật người dùng", { position: "top-right" });
                return null;
            }
            toast.success("Cập nhật người dùng thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi cập nhật người dùng:", error);
            toast.error("Đã xảy ra lỗi khi cập nhật người dùng", { position: "top-right" });
            return null;
        }
    }

    async deleteUser(username) {
        logApiCall('deleteUser');
        try {
            const apiResponse = await identityHttpClient.delete(`/users/${username}`);
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể xóa người dùng", { position: "top-right" });
                return false;
            }
            toast.success("Xóa người dùng thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi xóa người dùng ${username}:`, error);
            toast.error("Đã xảy ra lỗi khi xóa người dùng", { position: "top-right" });
            return false;
        }
    }

    async getMyProfile() {
        logApiCall('getMyProfile');
        try {
            const apiResponse = await identityHttpClient.get('/users/me');
            if (apiResponse.code !== 200) {
                console.error('Lỗi lấy thông tin profile của người dùng hiện tại:', apiResponse.message);
                return null;
            }
            return apiResponse.result;
        } catch (error) {
            console.error('Lỗi lấy thông tin profile của người dùng hiện tại:', error);
            return null;
        }
    }

    async getProfileByUserId(userId) {
        logApiCall('getProfileByUserId');
        try {
            const apiResponse = await identityHttpClient.get(`/users/${userId}`);
            if (apiResponse.code !== 200) {
                console.error(`Lỗi lấy thông tin profile của người dùng ID ${userId}:`, apiResponse.message);
                return null;
            }
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin profile của người dùng ID ${userId}:`, error);
            return null;
        }
    }

    async uploadAvatar(file, userId) {
        logApiCall('uploadAvatar');
        try {
            const formData = new FormData();
            formData.append('image', file);
            const endpoint = userId ? `/users/${userId}/avatar` : '/users/me/avatar';
            const apiResponse = await identityHttpClient.put(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể tải lên avatar", { position: "top-right" });
                return null;
            }
            toast.success("Tải lên avatar thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi tải lên avatar:", error);
            toast.error("Đã xảy ra lỗi khi tải lên avatar", { position: "top-right" });
            return null;
        }
    }

    async toggleUserStatus(userId, enabled, reason) {
        logApiCall('toggleUserStatus');
        try {
            const request = { userId, enabled, reason: !enabled ? reason : undefined };
            const apiResponse = await identityHttpClient.put(`/users/${userId}/status`, request);
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || `Không thể ${enabled ? 'mở khóa' : 'khóa'} tài khoản`, { position: "top-right" });
                return null;
            }
            toast.success(`${enabled ? 'Mở khóa' : 'Khóa'} tài khoản thành công`, { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi ${enabled ? 'mở khóa' : 'khóa'} tài khoản:`, error);
            toast.error(`Đã xảy ra lỗi khi ${enabled ? 'mở khóa' : 'khóa'} tài khoản`, { position: "top-right" });
            return null;
        }
    }

    async searchUsers(keyword, roleId = undefined, provider = undefined, enabled = undefined, page = 0, size = 10, sort = 'username') {
        logApiCall('searchUsers');
        try {
            let url = `/users/search?page=${page}&size=${size}&sort=${sort}`;
            if (keyword && keyword.trim() !== '') url += `&keyword=${encodeURIComponent(keyword)}`;
            if (roleId !== undefined) url += `&roleId=${roleId}`;
            if (provider !== undefined) url += `&provider=${provider}`;
            if (enabled !== undefined) url += `&enabled=${enabled}`;
            const apiResponse = await identityHttpClient.get(url);
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể tìm kiếm người dùng", { position: "top-right" });
                return null;
            }
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi tìm kiếm người dùng:", error);
            toast.error("Đã xảy ra lỗi khi tìm kiếm người dùng", { position: "top-right" });
            return null;
        }
    }

    async getUserStatistics() {
        logApiCall('getUserStatistics');
        try {
            const apiResponse = await identityHttpClient.get('/users/statistics');
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy thống kê người dùng", { position: "top-right" });
                return null;
            }
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy thống kê người dùng:", error);
            toast.error("Đã xảy ra lỗi khi lấy thống kê người dùng", { position: "top-right" });
            return null;
        }
    }

    async getTotalUsers() {
        logApiCall('getTotalUsers');
        try {
            const apiResponse = await identityHttpClient.get('/users/statistics/total');
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy tổng số người dùng", { position: "top-right" });
                return 0;
            }
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy tổng số người dùng:", error);
            return 0;
        }
    }

    async getNewUsersToday() {
        logApiCall('getNewUsersToday');
        try {
            const apiResponse = await identityHttpClient.get('/users/statistics/daily');
            if (apiResponse.code !== 200) {
                console.error("Không thể lấy số người dùng mới trong ngày:", apiResponse.message);
                return 0;
            }
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy số người dùng mới trong ngày:", error);
            return 0;
        }
    }


}

const userService = new UserService();
export default userService;
