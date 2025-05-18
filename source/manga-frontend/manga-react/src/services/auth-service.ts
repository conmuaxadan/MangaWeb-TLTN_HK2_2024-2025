import { toast } from "react-toastify";
import { identityHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { AuthRequest, AuthResponse, GoogleLinkRequest, GoogleLoginRequest, LinkLocalAccountRequest, LinkedAccountResponse, RefreshTokenRequest, UserRegistrationRequest, UserResponse } from "../interfaces/models/auth";
import { OAuthConfig } from "../configurations/configuration.ts";
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
        logApiCall('googleLogin');
        try {
            const request: GoogleLoginRequest = {
                code,
                redirectUri: OAuthConfig.redirectUri,
            };
            const apiResponse = await identityHttpClient.post<ApiResponse<AuthResponse>>('/auth/google/tokens', request);

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
        logApiCall('register');
        try {
            const request: UserRegistrationRequest = { username, password, email };
            const apiResponse = await identityHttpClient.post<ApiResponse<UserResponse>>('/users', request);

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
    getCurrentUser(): { userId: string, email: string, authProvider?: string, username?: string } | false {
        logApiCall('getCurrentUser');
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
            console.log('JWT payload:', payload); // Log ra payload để debug

            return {
                userId: payload.sub, // ID người dùng là subject của token
                email: payload.email, // Email được thêm vào claim
                authProvider: payload.authProvider, // Loại tài khoản (LOCAL, GOOGLE, etc.)
                username: payload.username
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

            const request: RefreshTokenRequest = { refreshToken };
            const apiResponse = await identityHttpClient.post<ApiResponse<AuthResponse>>('/auth/tokens/refresh', request);

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

    /**
     * Liên kết tài khoản hiện tại với tài khoản Google
     * @param code Code từ Google OAuth
     * @returns true nếu liên kết thành công, false nếu thất bại
     */
    async linkGoogleAccount(code: string): Promise<boolean> {
        logApiCall('linkGoogleAccount');
        try {
            const request: GoogleLinkRequest = {
                code,
                redirectUri: OAuthConfig.redirectUri,
            };
            const apiResponse = await identityHttpClient.post<ApiResponse<void>>('/users/accounts/google', request);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Liên kết tài khoản Google thất bại", { position: "top-right" });
                return false;
            }

            toast.success("Liên kết tài khoản Google thành công!", { position: "top-right" });
            return true;
        } catch (error) {
            console.error("Lỗi liên kết tài khoản Google:", error);
            toast.error("Đã xảy ra lỗi khi liên kết tài khoản Google", { position: "top-right" });
            return false;
        }
    }

    /**
     * Liên kết tài khoản hiện tại với tài khoản Local mới
     * @param username Tên đăng nhập mới
     * @param email Email mới
     * @param password Mật khẩu mới
     * @returns true nếu liên kết thành công, false nếu thất bại
     */
    async linkLocalAccount(username: string, email: string, password: string): Promise<boolean> {
        logApiCall('linkLocalAccount');
        try {
            const request: LinkLocalAccountRequest = { username, email, password };
            const apiResponse = await identityHttpClient.post<ApiResponse<void>>('/users/accounts/local', request);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Liên kết tài khoản Local thất bại", { position: "top-right" });
                return false;
            }

            toast.success("Liên kết tài khoản Local thành công!", { position: "top-right" });
            return true;
        } catch (error) {
            console.error("Lỗi liên kết tài khoản Local:", error);
            toast.error("Đã xảy ra lỗi khi liên kết tài khoản Local", { position: "top-right" });
            return false;
        }
    }

    /**
     * Lấy danh sách tài khoản đã liên kết
     * @returns Danh sách tài khoản đã liên kết hoặc null nếu thất bại
     */
    async getLinkedAccounts(): Promise<LinkedAccountResponse[] | null> {
        logApiCall('getLinkedAccounts');
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<LinkedAccountResponse[]>>('/users/accounts');

            if (apiResponse.code !== 1000) {
                console.error("Lấy danh sách tài khoản liên kết thất bại:", apiResponse.message);
                return null;
            }

            // Log dữ liệu trả về để debug
            console.log('Dữ liệu tài khoản liên kết từ backend:', apiResponse.result);

            // Chuyển đổi linkedAt từ LocalDateTime sang string nếu cần
            const accounts = apiResponse.result.map(account => {
                // Xử lý trường hợp linkedAt là object có các trường date, month, year, ...
                let linkedAtStr = '';
                if (account.linkedAt) {
                    if (typeof account.linkedAt === 'string') {
                        linkedAtStr = account.linkedAt;
                    } else if (typeof account.linkedAt === 'object') {
                        // Nếu là object JSON từ LocalDateTime
                        try {
                            // Thử tạo ngày từ các trường của object
                            const dateObj = account.linkedAt as any;
                            if (dateObj.year && dateObj.monthValue && dateObj.dayOfMonth) {
                                const date = new Date(
                                    dateObj.year,
                                    dateObj.monthValue - 1, // Tháng trong JS bắt đầu từ 0
                                    dateObj.dayOfMonth,
                                    dateObj.hour || 0,
                                    dateObj.minute || 0,
                                    dateObj.second || 0
                                );
                                linkedAtStr = date.toISOString();
                            } else {
                                linkedAtStr = JSON.stringify(account.linkedAt);
                            }
                        } catch (error) {
                            console.error('Lỗi chuyển đổi linkedAt:', error);
                            linkedAtStr = JSON.stringify(account.linkedAt);
                        }
                    } else {
                        linkedAtStr = String(account.linkedAt);
                    }
                }

                return {
                    ...account,
                    linkedAt: linkedAtStr
                };
            });

            return accounts;
        } catch (error) {
            console.error("Lỗi lấy danh sách tài khoản liên kết:", error);
            return null;
        }
    }

    /**
     * Hủy liên kết tài khoản
     * @param accountId ID của tài khoản liên kết cần hủy
     * @returns true nếu hủy liên kết thành công, false nếu thất bại
     */
    async unlinkAccount(accountId: string): Promise<boolean> {
        logApiCall('unlinkAccount');
        console.log('unlinkAccount được gọi với accountId:', accountId);

        try {
            console.log('Gọi API DELETE đến:', `/users/accounts/${accountId}`);
            const apiResponse = await identityHttpClient.delete<ApiResponse<void>>(`/users/accounts/${accountId}`);
            console.log('Kết quả API:', apiResponse);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Hủy liên kết tài khoản thất bại", { position: "top-right" });
                return false;
            }

            toast.success("Hủy liên kết tài khoản thành công!", { position: "top-right" });
            return true;
        } catch (error: any) {
            console.error("Lỗi hủy liên kết tài khoản:", error);

            // Xử lý lỗi từ backend
            if (error.response && error.response.data && error.response.data.message) {
                // Hiển thị thông báo lỗi từ backend
                toast.error(error.response.data.message, { position: "top-right" });
            } else {
                toast.error("Đã xảy ra lỗi khi hủy liên kết tài khoản", { position: "top-right" });
            }
            return false;
        }
    }

    /**
     * Lấy thông tin chi tiết của người dùng hiện tại
     * @returns Thông tin người dùng hoặc null nếu thất bại
     */
    async getMyInfo(): Promise<UserResponse | null> {
        logApiCall('getMyInfo');
        try {
            const apiResponse = await identityHttpClient.get<ApiResponse<UserResponse>>('/users/me');

            if (apiResponse.code !== 1000) {
                console.error("Lấy thông tin người dùng thất bại:", apiResponse.message);
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy thông tin người dùng:", error);
            return null;
        }
    }
}

export default new AuthService();