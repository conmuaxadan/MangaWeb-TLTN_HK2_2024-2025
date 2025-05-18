import { toast } from "react-toastify";
import { identityHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { AuthRequest, AuthResponse, UserResponse } from "../interfaces/models/auth";
import { TOKEN_STORAGE, setTokenExpiry } from "../configurations/api-config";
import { logApiCall } from "../utils/api-logger";

class AuthService {
    /**
     * Đăng nhập với username và password
     * @param username Tên đăng nhập
     * @param password Mật khẩu
     * @returns Thông tin xác thực hoặc false nếu thất bại
     */
    async login(username: string, password: string): Promise<AuthResponse | false> {
        logApiCall('login');
        try {
            const request: AuthRequest = { username, password };
            const apiResponse = await identityHttpClient.post<ApiResponse<AuthResponse>>('/auth/tokens', request);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Đăng nhập thất bại", {position: "top-right"});
                return false;
            }

            if (!apiResponse.result || !apiResponse.result.authenticated) {
                toast.error("Xác thực thất bại", {position: "top-right"});
                return false;
            }

            // Lưu token vào localStorage
            localStorage.setItem(TOKEN_STORAGE.ACCESS_TOKEN, apiResponse.result.token);
            localStorage.setItem(TOKEN_STORAGE.REFRESH_TOKEN, apiResponse.result.refreshToken);

            // Lưu thời gian hết hạn của token
            if (apiResponse.result.expiresIn) {
                setTokenExpiry(apiResponse.result.expiresIn);
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            toast.error("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.", {position: "top-right"});
            return false;
        }
    }

    /**
     * Đăng xuất
     */
    async logout(): Promise<boolean> {
        logApiCall('logout');
        try {
            // Xóa tất cả các token khỏi localStorage
            localStorage.removeItem(TOKEN_STORAGE.ACCESS_TOKEN);
            localStorage.removeItem(TOKEN_STORAGE.REFRESH_TOKEN);
            localStorage.removeItem(TOKEN_STORAGE.TOKEN_EXPIRY);
            return true;
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
            return false;
        }
    }

    /**
     * Làm mới token sử dụng refresh token
     * @returns Thông tin xác thực mới hoặc false nếu thất bại
     */
    async refreshToken(): Promise<AuthResponse | false> {
        logApiCall('refreshToken');
        try {
            const refreshToken = localStorage.getItem(TOKEN_STORAGE.REFRESH_TOKEN);
            if (!refreshToken) {
                console.error("Không tìm thấy refresh token");
                return false;
            }

            const request = { refreshToken };
            const apiResponse = await identityHttpClient.post<ApiResponse<AuthResponse>>('/auth/tokens/refresh', request);

            if (apiResponse.code !== 1000) {
                console.error("Làm mới token thất bại:", apiResponse.message);
                return false;
            }

            if (!apiResponse.result || !apiResponse.result.authenticated) {
                console.error("Xác thực thất bại khi làm mới token");
                return false;
            }

            // Lưu token mới vào localStorage
            localStorage.setItem(TOKEN_STORAGE.ACCESS_TOKEN, apiResponse.result.token);
            localStorage.setItem(TOKEN_STORAGE.REFRESH_TOKEN, apiResponse.result.refreshToken);

            // Lưu thời gian hết hạn của token
            if (apiResponse.result.expiresIn) {
                setTokenExpiry(apiResponse.result.expiresIn);
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi làm mới token:", error);
            return false;
        }
    }

    /**
     * Kiểm tra xem người dùng đã đăng nhập hay chưa
     * @returns true nếu đã đăng nhập, false nếu chưa
     */
    isLoggedIn(): boolean {
        return !!localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
    }


    /**
     * Lấy thông tin người dùng từ token JWT
     * @returns Thông tin người dùng hoặc null nếu không có token
     */
    getMyInfo(): UserResponse | null {
        logApiCall('getMyInfo');
        try {
            const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
            if (!token) {
                console.log("getMyInfo: Không tìm thấy token");
                return null;
            }

            // Giải mã token JWT (chỉ lấy phần payload)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            console.log("getMyInfo: Token payload:", payload);

            // Kiểm tra xem token có chứa scope (quyền) không
            if (!payload.scope) {
                console.warn("getMyInfo: Token không chứa thông tin quyền (scope)");
            }

            // Kiểm tra xem scope có chứa ROLE_ADMIN không
            const hasAdminRole = payload.scope && payload.scope.includes('ROLE_ADMIN');
            console.log("getMyInfo: Có quyền ADMIN:", hasAdminRole);

            // Tạo đối tượng UserResponse từ payload
            return {
                id: payload.sub, // subject trong JWT là user ID
                username: payload.username,
                email: payload.email,
                roles: [{
                    name: payload.scope || 'ROLE_USER',
                    id: 0,
                    description: ""
                }],
                authProvider: payload.authProvider || 'LOCAL',
                displayName: payload.displayName,
            };
        } catch (error) {
            console.error("Lỗi lấy thông tin người dùng từ token:", error);
            return null;
        }
    }

    /**
     * Giải mã JWT token để lấy thông tin
     * @param token JWT token
     * @returns Thông tin từ token hoặc false nếu thất bại
     */
    decodeToken(token: string): { userId: string; email: string; authProvider: string } | false {
        try {
            // Tách phần payload của JWT (phần thứ 2 sau dấu .)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );

            const payload = JSON.parse(jsonPayload);
            console.log('JWT payload:', payload);

            return {
                userId: payload.sub, // ID người dùng là subject của token
                email: payload.email || '', // Email được thêm vào claim
                authProvider: payload.authProvider || 'LOCAL' // Loại tài khoản (LOCAL, GOOGLE, etc.)
            };
        } catch (error) {
            console.error("Lỗi giải mã JWT token:", error);
            return false;
        }
    }
}

export default new AuthService();
