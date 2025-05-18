import { toast } from "react-toastify";
import { identityHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { RoleResponse, RoleRequest, PermissionResponse } from "../interfaces/models/auth";
import { logApiCall } from "../utils/api-logger";

class RoleService {
    /**
     * Lấy danh sách tất cả vai trò
     * @returns Danh sách vai trò hoặc null nếu thất bại
     */
    async getAllRoles(): Promise<RoleResponse[] | null> {
        logApiCall('getAllRoles');
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<RoleResponse[]>>('/roles');

            if (apiResponse.code !== 1000) {
                console.error("Không thể lấy danh sách vai trò:", apiResponse.message);
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách vai trò:", error);
            return null;
        }
    }

    /**
     * Lấy danh sách vai trò có phân trang
     * @param page Số trang
     * @param size Số lượng item trên mỗi trang
     * @param sort Trường sắp xếp
     * @returns Danh sách vai trò có phân trang hoặc null nếu thất bại
     */
    async getRolesPaginated(page: number = 0, size: number = 10, sort: string = 'name'): Promise<any | null> {
        logApiCall('getRolesPaginated');
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<any>>(
                `/roles/paginated?page=${page}&size=${size}&sort=${sort}`
            );

            if (apiResponse.code !== 1000) {
                console.error("Không thể lấy danh sách vai trò phân trang:", apiResponse.message);
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách vai trò phân trang:", error);
            return null;
        }
    }

    /**
     * Tạo vai trò mới
     * @param roleRequest Thông tin vai trò mới
     * @returns Thông tin vai trò đã tạo hoặc null nếu thất bại
     */
    async createRole(roleRequest: RoleRequest): Promise<RoleResponse | null> {
        logApiCall('createRole');
        try {
            const apiResponse = await identityHttpClient.post<ApiResponse<RoleResponse>>('/roles', roleRequest);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể tạo vai trò", { position: "top-right" });
                return null;
            }

            toast.success("Tạo vai trò thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi tạo vai trò:", error);
            toast.error("Đã xảy ra lỗi khi tạo vai trò", { position: "top-right" });
            return null;
        }
    }

    /**
     * Cập nhật vai trò
     * @param roleId ID của vai trò cần cập nhật
     * @param roleName Tên vai trò (dùng để hiển thị thông báo)
     * @param roleRequest Thông tin vai trò cần cập nhật
     * @returns Thông tin vai trò đã cập nhật hoặc null nếu thất bại
     */
    async updateRole(roleId: number, roleName: string, roleRequest: RoleRequest): Promise<RoleResponse | null> {
        logApiCall('updateRole');
        console.log(`Gọi API cập nhật vai trò ID ${roleId}, name ${roleName} với dữ liệu:`, roleRequest);
        try {
            // Gọi API cập nhật vai trò
            const apiResponse = await identityHttpClient.put<ApiResponse<RoleResponse>>(`/roles/${roleId}`, roleRequest);
            console.log('Kết quả API cập nhật vai trò:', apiResponse);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể cập nhật vai trò", { position: "top-right" });
                return null;
            }

            toast.success("Cập nhật vai trò thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi cập nhật vai trò ${roleName} (ID: ${roleId}):`, error);
            console.error('Chi tiết lỗi:', error);
            toast.error("Đã xảy ra lỗi khi cập nhật vai trò", { position: "top-right" });
            return null;
        }
    }

    /**
     * Xóa vai trò
     * @param roleId ID của vai trò cần xóa
     * @param roleName Tên vai trò (dùng để hiển thị thông báo)
     * @returns true nếu thành công, false nếu thất bại
     */
    async deleteRole(roleId: number, roleName: string): Promise<boolean> {
        logApiCall('deleteRole');

        // Kiểm tra xem có phải vai trò đặc biệt không (ADMIN, USER)
        if (roleName === 'ADMIN' || roleName === 'USER') {
            // Không cho phép xóa vai trò đặc biệt
            toast.error(`Không thể xóa vai trò ${roleName} vì đây là vai trò hệ thống`, { position: "top-right" });
            return false;
        }

        try {
            const apiResponse = await identityHttpClient.delete<ApiResponse<void>>(`/roles/${roleId}`);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể xóa vai trò", { position: "top-right" });
                return false;
            }

            toast.success("Xóa vai trò thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi xóa vai trò ${roleName} (ID: ${roleId}):`, error);
            toast.error("Đã xảy ra lỗi khi xóa vai trò", { position: "top-right" });
            return false;
        }
    }
    /**
     * Lấy danh sách tất cả quyền hạn
     * @returns Danh sách quyền hạn hoặc null nếu thất bại
     */
    async getAllPermissions(): Promise<PermissionResponse[] | null> {
        logApiCall('getAllPermissions');
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<PermissionResponse[]>>('/permissions');

            if (apiResponse.code !== 1000) {
                console.error("Không thể lấy danh sách quyền hạn:", apiResponse.message);
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách quyền hạn:", error);
            return null;
        }
    }

    /**
     * Tạo quyền hạn mới
     * @param permissionRequest Thông tin quyền hạn mới
     * @returns Thông tin quyền hạn đã tạo hoặc null nếu thất bại
     */
    async createPermission(permissionRequest: { name: string, description?: string }): Promise<PermissionResponse | null> {
        logApiCall('createPermission');
        try {
            const apiResponse = await identityHttpClient.post<ApiResponse<PermissionResponse>>('/permissions', permissionRequest);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể tạo quyền hạn", { position: "top-right" });
                return null;
            }

            toast.success("Tạo quyền hạn thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi tạo quyền hạn:", error);
            toast.error("Đã xảy ra lỗi khi tạo quyền hạn", { position: "top-right" });
            return null;
        }
    }

    /**
     * Xóa quyền hạn
     * @param permissionId ID của quyền hạn cần xóa
     * @param permissionName Tên quyền hạn (dùng để hiển thị thông báo)
     * @returns true nếu thành công, false nếu thất bại
     */
    async deletePermission(permissionId: number, permissionName: string): Promise<boolean> {
        logApiCall('deletePermission');
        try {
            const apiResponse = await identityHttpClient.delete<ApiResponse<void>>(`/permissions/${permissionId}`);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể xóa quyền hạn", { position: "top-right" });
                return false;
            }

            toast.success("Xóa quyền hạn thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi xóa quyền hạn ${permissionName} (ID: ${permissionId}):`, error);
            toast.error("Đã xảy ra lỗi khi xóa quyền hạn", { position: "top-right" });
            return false;
        }
    }

    /**
     * Lấy thông tin chi tiết của vai trò theo ID
     * @param roleId ID của vai trò
     * @returns Thông tin chi tiết vai trò hoặc null nếu thất bại
     */
    async getRoleById(roleId: number): Promise<RoleResponse | null> {
        logApiCall('getRoleById');
        console.log(`RoleService: Gọi API lấy thông tin vai trò ID ${roleId}`);
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<RoleResponse>>(`/roles/${roleId}`);
            console.log(`RoleService: Kết quả API lấy thông tin vai trò ID ${roleId}:`, apiResponse);

            if (apiResponse.code !== 1000) {
                console.error(`Không thể lấy thông tin vai trò ID ${roleId}: ${apiResponse.message}`);
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin vai trò ID ${roleId}:`, error);
            console.error('Chi tiết lỗi:', error);
            return null;
        }
    }

    /**
     * Cập nhật quyền hạn
     * @param permissionId ID của quyền hạn cần cập nhật
     * @param permissionRequest Thông tin quyền hạn cần cập nhật
     * @returns Thông tin quyền hạn đã cập nhật hoặc null nếu thất bại
     */
    async updatePermission(permissionId: number, permissionRequest: { name: string, description?: string }): Promise<PermissionResponse | null> {
        logApiCall('updatePermission');
        console.log(`Gọi API cập nhật quyền hạn ID ${permissionId} với dữ liệu:`, permissionRequest);
        try {
            const apiResponse = await identityHttpClient.put<ApiResponse<PermissionResponse>>(`/permissions/${permissionId}`, permissionRequest);
            console.log('Kết quả API cập nhật quyền hạn:', apiResponse);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể cập nhật quyền hạn", { position: "top-right" });
                return null;
            }

            toast.success("Cập nhật quyền hạn thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi cập nhật quyền hạn ID ${permissionId}:`, error);
            console.error('Chi tiết lỗi:', error);
            toast.error("Đã xảy ra lỗi khi cập nhật quyền hạn", { position: "top-right" });
            return null;
        }
    }

    /**
     * Lấy thông tin chi tiết của vai trò theo tên
     * @param roleName Tên vai trò
     * @returns Thông tin chi tiết vai trò hoặc null nếu thất bại
     */
    async getRoleByName(roleName: string): Promise<RoleResponse | null> {
        logApiCall('getRoleByName');
        try {
            // Lấy danh sách tất cả vai trò
            const allRoles = await this.getAllRoles();
            if (!allRoles) {
                console.error(`Không thể lấy danh sách vai trò`);
                return null;
            }

            // Tìm vai trò theo tên
            const role = allRoles.find(r => r.name === roleName);
            if (!role) {
                console.error(`Không tìm thấy vai trò ${roleName}`);
                return null;
            }

            return role;
        } catch (error) {
            console.error(`Lỗi lấy thông tin vai trò ${roleName}:`, error);
            return null;
        }
    }
}

export default new RoleService();
