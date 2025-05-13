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
}

export default new UserService();
