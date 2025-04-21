import { toast } from "react-toastify";
import { identityHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { AuthRequest, AuthResponse, GoogleLoginRequest, RefreshTokenRequest, UserRegistrationRequest, UserResponse } from "../interfaces/models/auth";
import { OAuthConfig } from "../configurations/configuration.ts";
import { TOKEN_STORAGE, setTokenExpiry } from "../configurations/api-config";

class AuthService {

    /**
     * Đăng nhập với username và password
     * @param username Tên đăng nhập
     * @param password Mật khẩu
     * @returns Thông tin xác thực hoặc false nếu thất bại
     */
    async login(username: string, password: string): Promise<AuthResponse | false> {
        try {
            const request: AuthRequest = { username, password };
            const apiResponse = await identityHttpClient.post<ApiResponse<AuthResponse>>('/auth/login', request);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Đăng nhập thất bại", {position: "top-right"});
                return false;
            }

            if (!apiResponse.result || !apiResponse.result.authenticated) {
                toast.error("Xác thực thất bại", {position: "top-right"});
                return false;
            }

            // Lưu access token và refresh token
            localStorage.setItem(TOKEN_STORAGE.ACCESS_TOKEN, apiResponse.result.token);
            localStorage.setItem(TOKEN_STORAGE.REFRESH_TOKEN, apiResponse.result.refreshToken);

            // Lưu thời gian hết hạn của token
            if (apiResponse.result.expiresIn) {
                setTokenExpiry(apiResponse.result.expiresIn);
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            return false;
        }
    }

    /**
     * Đăng nhập với Google OAuth
     * @param code Code từ Google OAuth
     * @returns Thông tin xác thực hoặc false nếu thất bại
     */
    async googleLogin(code: string): Promise<AuthResponse | false> {
        try {
            const request: GoogleLoginRequest = {
                code,
                redirectUri: OAuthConfig.redirectUri,
            };
            const apiResponse = await identityHttpClient.post<ApiResponse<AuthResponse>>('/auth/google-login', request);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Đăng nhập Google thất bại", { position: "top-right" });
                return false;
            }

            if (!apiResponse.result || !apiResponse.result.authenticated) {
                toast.error("Xác thực Google thất bại", { position: "top-right" });
                return false;
            }

            // Lưu access token và refresh token
            localStorage.setItem(TOKEN_STORAGE.ACCESS_TOKEN, apiResponse.result.token);
            localStorage.setItem(TOKEN_STORAGE.REFRESH_TOKEN, apiResponse.result.refreshToken);

            // Lưu thời gian hết hạn của token
            if (apiResponse.result.expiresIn) {
                setTokenExpiry(apiResponse.result.expiresIn);
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi đăng nhập Google:", error);
            return false;
        }
    }

    /**
     * Đăng ký tài khoản mới
     * @param username Tên đăng nhập
     * @param password Mật khẩu
     * @param email Email
     * @returns Thông tin người dùng hoặc false nếu thất bại
     */
    async register(username: string, password: string, email: string): Promise<UserResponse | false> {
        try {
            const request: UserRegistrationRequest = { username, password, email };
            const apiResponse = await identityHttpClient.post<ApiResponse<UserResponse>>('/users/register', request);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Đăng ký thất bại", { position: "top-right" });
                return false;
            }

            toast.success("Đăng ký thành công! Vui lòng đăng nhập.", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            return false;
        }
    }

    /**
     * Lấy thông tin người dùng hiện tại từ JWT token
     * @returns Thông tin người dùng hoặc false nếu thất bại
     */
    getCurrentUser(): { userId: string, email: string } | false {
        try {
            const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
            if (!token) {
                return false;
            }

            // Giải mã JWT token (phần payload)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);

            return {
                userId: payload.sub, // ID người dùng là subject của token
                email: payload.email // Email được thêm vào claim
            };
        } catch (error) {
            console.error("Lỗi giải mã JWT token:", error);
            return false;
        }
    }

    /**
     * Đăng xuất
     */
    async logout(): Promise<boolean> {
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
        try {
            const refreshToken = localStorage.getItem(TOKEN_STORAGE.REFRESH_TOKEN);
            if (!refreshToken) {
                console.error("Không tìm thấy refresh token");
                return false;
            }

            const request: RefreshTokenRequest = { refreshToken };
            const apiResponse = await identityHttpClient.post<ApiResponse<AuthResponse>>('/auth/refresh-token', request);

            if (apiResponse.code !== 1000) {
                console.error("Làm mới token thất bại:", apiResponse.message);
                return false;
            }

            if (!apiResponse.result || !apiResponse.result.authenticated) {
                console.error("Xác thực thất bại khi làm mới token");
                return false;
            }

            // Lưu access token mới
            localStorage.setItem(TOKEN_STORAGE.ACCESS_TOKEN, apiResponse.result.token);

            // Lưu thời gian hết hạn mới
            if (apiResponse.result.expiresIn) {
                setTokenExpiry(apiResponse.result.expiresIn);
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi khi làm mới token:", error);
            return false;
        }
    }
}

export default new AuthService();