import { toast } from "react-toastify";
import { identityHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { UserRequest, UserResponse } from "../interfaces/models/auth";
import { logApiCall } from "../utils/api-logger";

class UserService {
    /**
     * Lấy danh sách tất cả người dùng
     * @returns Danh sách người dùng hoặc null nếu thất bại
     */
    async getAllUsers(): Promise<UserResponse[] | null> {
        logApiCall('getAllUsers');
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<UserResponse[]>>('/users');

            if (apiResponse.code !== 1000) {
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

    /**
     * Lấy danh sách người dùng có phân trang
     * @param page Số trang
     * @param size Số lượng item trên mỗi trang
     * @param sort Trường sắp xếp
     * @returns Danh sách người dùng có phân trang hoặc null nếu thất bại
     */
    async getUsersPaginated(page: number = 0, size: number = 10, sort: string = 'username'): Promise<any | null> {
        logApiCall('getUsersPaginated');
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<any>>(
                `/users/paginated?page=${page}&size=${size}&sort=${sort}`
            );

            if (apiResponse.code !== 1000) {
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

    /**
     * Lấy thông tin người dùng theo username
     * @param username Username của người dùng
     * @returns Thông tin người dùng hoặc null nếu thất bại
     */
    async getUserByUsername(username: string): Promise<UserResponse | null> {
        logApiCall('getUserByUsername');
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<UserResponse>>(`/users/${username}`);

            if (apiResponse.code !== 1000) {
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

    /**
     * Tạo người dùng mới
     * @param request Thông tin người dùng mới
     * @returns Thông tin người dùng đã tạo hoặc null nếu thất bại
     */
    async createUser(request: UserRequest): Promise<UserResponse | null> {
        logApiCall('createUser');
        try {
            const apiResponse = await identityHttpClient.post<ApiResponse<UserResponse>>('/users', request);

            if (apiResponse.code !== 1000) {
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

    /**
     * Cập nhật thông tin người dùng
     * @param request Thông tin người dùng cần cập nhật
     * @returns Thông tin người dùng đã cập nhật hoặc null nếu thất bại
     */
    async updateUser(request: UserRequest): Promise<UserResponse | null> {
        logApiCall('updateUser');
        try {
            const apiResponse = await identityHttpClient.put<ApiResponse<UserResponse>>('/users', request);

            if (apiResponse.code !== 1000) {
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

    /**
     * Xóa người dùng
     * @param username Username của người dùng cần xóa
     * @returns true nếu thành công, false nếu thất bại
     */
    async deleteUser(username: string): Promise<boolean> {
        logApiCall('deleteUser');
        try {
            const apiResponse = await identityHttpClient.delete<ApiResponse<void>>(`/users/${username}`);

            if (apiResponse.code !== 1000) {
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

    /**
     * Lấy thông tin profile của người dùng theo ID
     * @param userId ID của người dùng
     * @returns Thông tin profile hoặc null nếu thất bại
     */
    async getProfileByUserId(userId: string): Promise<UserResponse | null> {
        logApiCall('getProfileByUserId');
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<UserResponse>>(`/users/byUserId/${userId}`);

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
     * Upload avatar cho người dùng
     * @param file File ảnh avatar
     * @param userId ID của người dùng (tùy chọn, mặc định là người dùng hiện tại)
     * @returns Thông tin người dùng đã cập nhật hoặc null nếu thất bại
     */
    async uploadAvatar(file: File, userId?: string): Promise<UserResponse | null> {
        logApiCall('uploadAvatar');
        try {
            const formData = new FormData();
            formData.append('image', file);

            // Xác định endpoint dựa trên userId
            const endpoint = userId
                ? `/users/${userId}/avatar` // Endpoint cho admin cập nhật avatar của người dùng khác
                : '/users/me/avatar';      // Endpoint cho người dùng cập nhật avatar của chính mình

            const apiResponse = await identityHttpClient.post<ApiResponse<UserResponse>>(
                endpoint,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể cập nhật ảnh đại diện", { position: "top-right" });
                return null;
            }

            toast.success("Cập nhật ảnh đại diện thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi upload avatar:", error);
            toast.error("Lỗi khi cập nhật ảnh đại diện", { position: "top-right" });
            return null;
        }
    }

    /**
     * Xóa avatar của người dùng
     * @param userId ID của người dùng
     * @returns Thông tin người dùng đã cập nhật hoặc null nếu thất bại
     */
    async deleteAvatar(userId: string): Promise<UserResponse | null> {
        logApiCall('deleteAvatar');
        try {
            const apiResponse = await identityHttpClient.delete<ApiResponse<UserResponse>>(`/users/${userId}/avatar`);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể xóa ảnh đại diện", { position: "top-right" });
                return null;
            }

            toast.success("Xóa ảnh đại diện thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi xóa avatar:", error);
            toast.error("Lỗi khi xóa ảnh đại diện", { position: "top-right" });
            return null;
        }
    }
}

export default new UserService();
