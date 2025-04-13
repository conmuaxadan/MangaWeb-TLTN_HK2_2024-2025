import { toast } from "react-toastify";
import { identityHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { AuthRequest, AuthResponse, GoogleLoginRequest, UserRegistrationRequest, UserResponse } from "../interfaces/models/auth";
import {OAuthConfig} from "../configurations/configuration.ts";

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
     * Lấy thông tin người dùng hiện tại
     * @returns Thông tin người dùng hoặc false nếu thất bại
     */
    async getCurrentUser(): Promise<UserResponse | false> {
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<UserResponse>>('/users/myInfo');

            if (apiResponse.code !== 1000) {
                return false;
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy thông tin người dùng:", error);
            return false;
        }
    }

    /**
     * Đăng xuất
     */
    async logout(): Promise<boolean> {
        try {
            localStorage.removeItem('token');
            return true;
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
            return false;
        }
    }
}

export default new AuthService();