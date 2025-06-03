import { toast } from "react-toastify";
import { identityHttpClient } from "./http-client.js";
import { logApiCall } from "../utils/api-logger.js";

class RoleService {
    async getAllRoles() {
        logApiCall('getAllRoles');
        try {
            const apiResponse = await identityHttpClient.get('/roles');
            if (apiResponse.code !== 200) {
                console.error("Không thể lấy danh sách vai trò:", apiResponse.message);
                return null;
            }
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách vai trò:", error);
            return null;
        }
    }

    async getRolesPaginated(page = 0, size = 10, sort = 'name') {
        logApiCall('getRolesPaginated');
        try {
            const apiResponse = await identityHttpClient.get(
                `/roles/paginated?page=${page}&size=${size}&sort=${sort}`
            );
            if (apiResponse.code !== 200) {
                console.error("Không thể lấy danh sách vai trò phân trang:", apiResponse.message);
                return null;
            }
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách vai trò phân trang:", error);
            return null;
        }
    }

    async createRole(roleRequest) {
        logApiCall('createRole');
        try {
            const apiResponse = await identityHttpClient.post('/roles', roleRequest);
            if (apiResponse.code !== 201) {
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

    async updateRole(roleId, roleName, roleRequest) {
        logApiCall('updateRole');
        console.log(`Gọi API cập nhật vai trò ID ${roleId}, name ${roleName} với dữ liệu:`, roleRequest);
        try {
            const apiResponse = await identityHttpClient.put(`/roles/${roleId}`, roleRequest);
            console.log('Kết quả API cập nhật vai trò:', apiResponse);
            if (apiResponse.code !== 200) {
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

    async deleteRole(roleId, roleName) {
        logApiCall('deleteRole');
        if (roleName === 'ROLE_ADMIN' || roleName === 'ROLE_USER') {
            toast.error(`Không thể xóa vai trò ${roleName} vì đây là vai trò hệ thống`, { position: "top-right" });
            return false;
        }
        try {
            const apiResponse = await identityHttpClient.delete(`/roles/${roleId}`);
            if (apiResponse.code !== 200) {
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

    async getAllPermissions() {
        logApiCall('getAllPermissions');
        try {
            const apiResponse = await identityHttpClient.get('/permissions');
            if (apiResponse.code !== 200) {
                console.error("Không thể lấy danh sách quyền hạn:", apiResponse.message);
                return null;
            }
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách quyền hạn:", error);
            return null;
        }
    }

    async createPermission(permissionRequest) {
        logApiCall('createPermission');
        try {
            const apiResponse = await identityHttpClient.post('/permissions', permissionRequest);
            if (apiResponse.code !== 201) {
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

    async deletePermission(permissionId, permissionName) {
        logApiCall('deletePermission');
        try {
            const apiResponse = await identityHttpClient.delete(`/permissions/${permissionId}`);
            if (apiResponse.code !== 200) {
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

    async getRoleById(roleId) {
        logApiCall('getRoleById');
        console.log(`RoleService: Gọi API lấy thông tin vai trò ID ${roleId}`);
        try {
            const apiResponse = await identityHttpClient.get(`/roles/${roleId}`);
            console.log(`RoleService: Kết quả API lấy thông tin vai trò ID ${roleId}:`, apiResponse);
            if (apiResponse.code !== 200) {
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

    async updatePermission(permissionId, permissionRequest) {
        logApiCall('updatePermission');
        console.log(`Gọi API cập nhật quyền hạn ID ${permissionId} với dữ liệu:`, permissionRequest);
        try {
            const apiResponse = await identityHttpClient.put(`/permissions/${permissionId}`, permissionRequest);
            console.log('Kết quả API cập nhật quyền hạn:', apiResponse);
            if (apiResponse.code !== 200) {
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

    async getRoleByName(roleName) {
        logApiCall('getRoleByName');
        try {
            const allRoles = await this.getAllRoles();
            if (!allRoles) {
                console.error(`Không thể lấy danh sách vai trò`);
                return null;
            }
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
