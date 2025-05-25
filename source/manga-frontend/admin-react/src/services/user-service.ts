import { toast } from "react-toastify";
import { identityHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { ToggleUserStatusRequest, UserPageResponse, UserRequest, UserResponse } from "../interfaces/models/auth";
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
     * @param page Số trang (bắt đầu từ 0)
     * @param size Số lượng item trên mỗi trang
     * @param sort Trường sắp xếp
     * @param search Từ khóa tìm kiếm (tùy chọn)
     * @returns Danh sách người dùng có phân trang hoặc null nếu thất bại
     */
    async getUsersPaginated(page: number = 0, size: number = 10, sort: string = 'username', search?: string): Promise<UserPageResponse | null> {
        logApiCall('getUsersPaginated');
        try {
            let url = `/users/paginated?page=${page}&size=${size}&sort=${sort}`;

            // Thêm tham số tìm kiếm nếu có
            if (search && search.trim() !== '') {
                url += `&search=${encodeURIComponent(search)}`;
            }

            const apiResponse = await identityHttpClient.get<ApiResponse<UserPageResponse>>(url);

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
     * @returns Thông tin người dùng ��ã tạo hoặc null nếu thất bại
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
            const apiResponse = await identityHttpClient.get<ApiResponse<UserResponse>>(`/users/id/${userId}`);

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

    /**
     * Khóa hoặc mở khóa tài khoản người dùng
     * @param userId ID của người dùng
     * @param enabled true để mở khóa, false để khóa
     * @returns Thông tin người dùng đã cập nhật hoặc null nếu thất bại
     */
    async toggleUserStatus(userId: string, enabled: boolean): Promise<UserResponse | null> {
        logApiCall('toggleUserStatus');
        try {
            const request: ToggleUserStatusRequest = {
                userId,
                enabled
            };

            // Sửa lại từ PUT thành POST và thay đổi endpoint từ /users/toggle-status thành /users/status
            const apiResponse = await identityHttpClient.post<ApiResponse<UserResponse>>(
                '/users/status',
                request
            );

            if (apiResponse.code !== 1000) {
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

    /**
     * Tìm kiếm người dùng có phân trang với bộ lọc nâng cao
     * @param keyword Từ khóa tìm kiếm (tên người dùng, email hoặc tên hiển thị)
     * @param roleId ID của vai trò cần lọc (tùy chọn)
     * @param provider Nhà cung cấp xác thực cần lọc (tùy chọn)
     * @param enabled Trạng thái tài khoản cần lọc (tùy chọn)
     * @param page Số trang (bắt đầu từ 0)
     * @param size Số lượng item trên mỗi trang
     * @param sort Trường sắp xếp
     * @returns Danh sách người dùng có phân trang hoặc null nếu thất bại
     */
    async searchUsers(
        keyword: string | undefined,
        roleId: number | undefined = undefined,
        provider: string | undefined = undefined,
        enabled: boolean | undefined = undefined,
        page: number = 0,
        size: number = 10,
        sort: string = 'username'
    ): Promise<UserPageResponse | null> {
        logApiCall('searchUsers');
        try {
            let url = `/users/search?page=${page}&size=${size}&sort=${sort}`;

            // Thêm các tham số tìm kiếm và lọc nếu có
            if (keyword && keyword.trim() !== '') {
                url += `&keyword=${encodeURIComponent(keyword)}`;
            }

            if (roleId !== undefined) {
                url += `&roleId=${roleId}`;
            }

            if (provider !== undefined) {
                url += `&provider=${provider}`;
            }

            if (enabled !== undefined) {
                url += `&enabled=${enabled}`;
            }

            const apiResponse = await identityHttpClient.get<ApiResponse<UserPageResponse>>(url);

            if (apiResponse.code !== 1000) {
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

    /**
     * Tìm kiếm và lọc người dùng theo nhiều tiêu chí
     * @param keyword Từ khóa tìm kiếm (tùy chọn)
     * @param roleId ID của vai trò cần lọc (tùy chọn)
     * @param provider Nhà cung cấp xác thực cần lọc (tùy chọn)
     * @param enabled Trạng thái tài khoản cần lọc (tùy chọn)
     * @param page Số trang (bắt đầu từ 0)
     * @param size Số lượng item trên mỗi trang
     * @param sort Trường sắp xếp
     * @returns Danh sách người dùng có phân trang đã được lọc
     */
    async filterUsers(
        keyword?: string,
        roleId?: number,
        provider?: string,
        enabled?: boolean,
        page: number = 0,
        size: number = 10,
        sort: string = 'username'
    ): Promise<UserPageResponse | null> {
        logApiCall('filterUsers');
        try {
            // Xây dựng URL cơ bản với các tham số phân trang
            let url = `/users/filter?page=${page}&size=${size}&sort=${sort}`;

            // Thêm các tham số lọc tùy chọn nếu có
            if (keyword && keyword.trim() !== '') {
                url += `&keyword=${encodeURIComponent(keyword)}`;
            }

            if (roleId !== undefined) {
                url += `&roleId=${roleId}`;
            }

            if (provider) {
                url += `&provider=${provider}`;
            }

            if (enabled !== undefined) {
                url += `&enabled=${enabled}`;
            }

            const apiResponse = await identityHttpClient.get<ApiResponse<UserPageResponse>>(url);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lọc danh sách người dùng", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lọc danh sách người dùng:", error);
            toast.error("Đã xảy ra lỗi khi lọc danh sách người dùng", { position: "top-right" });
            return null;
        }
    }
}

// Export singleton instance
const userService = new UserService();
export default userService;
