import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import authService from "../services/auth-service";
import userService from "../services/user-service";
import { TOKEN_STORAGE } from "../configurations/api-config";
import { UserResponse } from "../interfaces/models/auth";

interface AuthContextType {
    isLogin: boolean;
    isAdmin: boolean;
    user: UserResponse | null;
    userProfile: UserResponse | null;
    login: (authResponse: { token: string, refreshToken: string, expiresIn?: number }) => void;
    logout: () => void;
    refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLogin, setIsLogin] = useState<boolean>(() => {
        return !!localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
    });
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [user, setUser] = useState<UserResponse | null>(null);
    const [userProfile, setUserProfile] = useState<UserResponse | null>(null);

    // Lấy thông tin người dùng khi đã đăng nhập
    useEffect(() => {
        const fetchUserInfo = async () => {
            if (isLogin) {
                // Lấy thông tin cơ bản của người dùng từ token JWT
                const userInfo = authService.getMyInfo();
                if (userInfo) {
                    console.log("AuthContext: Thông tin người dùng từ token:", userInfo);
                    setUser(userInfo);

                    // Kiểm tra quyền admin từ token
                    const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
                    if (token) {
                        try {
                            const base64Url = token.split('.')[1];
                            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                            }).join(''));

                            const payload = JSON.parse(jsonPayload);
                            const hasAdminRole = payload.scope && payload.scope.includes('ROLE_ADMIN');
                            console.log("AuthContext: Có quyền ADMIN:", hasAdminRole);
                            setIsAdmin(hasAdminRole);
                        } catch (error) {
                            console.error("Lỗi khi kiểm tra quyền admin:", error);
                            setIsAdmin(false);
                        }
                    }

                    // Lấy thông tin chi tiết từ API
                    if (userInfo.id) {
                        try {
                            const profileData = await userService.getProfileByUserId(userInfo.id);
                            if (profileData) {
                                console.log("AuthContext: Thông tin chi tiết người dùng từ API:", profileData);
                                setUserProfile(profileData);
                            }
                        } catch (error) {
                            console.error("Lỗi khi lấy thông tin chi tiết người dùng:", error);
                        }
                    }
                }
            } else {
                // Nếu không đăng nhập, kiểm tra xem có token không
                const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
                if (token) {
                    // Nếu có token nhưng isLogin = false, thử lấy thông tin người dùng
                    const userInfo = authService.getMyInfo();
                    if (userInfo) {
                        console.log("AuthContext: Phát hiện token hợp lệ, đăng nhập lại");
                        setUser(userInfo);
                        setIsLogin(true);

                        // Kiểm tra quyền admin
                        const hasAdminRole = userInfo.roles && userInfo.roles.some(role => role.name.includes('ROLE_ADMIN'));
                        setIsAdmin(hasAdminRole);

                        // Lấy thông tin chi tiết
                        if (userInfo.id) {
                            try {
                                const profileData = await userService.getProfileByUserId(userInfo.id);
                                if (profileData) {
                                    setUserProfile(profileData);
                                }
                            } catch (error) {
                                console.error("Lỗi khi lấy thông tin chi tiết người dùng:", error);
                            }
                        }
                    }
                }
            }
        };

        fetchUserInfo();
    }, [isLogin]);

    // Hàm để làm mới thông tin người dùng từ API
    const refreshUserProfile = async () => {
        if (user?.id) {
            try {
                const profileData = await userService.getProfileByUserId(user.id);
                if (profileData) {
                    console.log("AuthContext: Làm mới thông tin chi tiết người dùng từ API:", profileData);
                    setUserProfile(profileData);
                }
            } catch (error) {
                console.error("Lỗi khi làm mới thông tin chi tiết người dùng:", error);
            }
        }
    };

    const login = async (authResponse: { token: string, refreshToken: string, expiresIn?: number }) => {
        console.log("AuthContext: Đăng nhập thành công, lưu token");

        // Lưu access token và refresh token
        localStorage.setItem(TOKEN_STORAGE.ACCESS_TOKEN, authResponse.token);
        localStorage.setItem(TOKEN_STORAGE.REFRESH_TOKEN, authResponse.refreshToken);

        // Lưu thời gian hết hạn nếu có
        if (authResponse.expiresIn) {
            const expiryTime = Date.now() + (authResponse.expiresIn * 1000);
            localStorage.setItem(TOKEN_STORAGE.TOKEN_EXPIRY, expiryTime.toString());
            console.log("AuthContext: Token hết hạn vào:", new Date(expiryTime).toLocaleString());
        }

        setIsLogin(true);

        // Sau khi đăng nhập, lấy thông tin người dùng từ token JWT
        const userInfo = authService.getMyInfo();
        if (userInfo) {
            console.log("AuthContext: Thông tin người dùng từ token:", userInfo);
            setUser(userInfo);

            // Kiểm tra quyền admin từ token
            try {
                const base64Url = authResponse.token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const payload = JSON.parse(jsonPayload);
                const hasAdminRole = payload.scope && payload.scope.includes('ROLE_ADMIN');
                console.log("AuthContext: Có quyền ADMIN:", hasAdminRole);
                setIsAdmin(hasAdminRole);
            } catch (error) {
                console.error("Lỗi khi kiểm tra quyền admin:", error);
                setIsAdmin(false);
            }

            // Lấy thông tin chi tiết từ API
            if (userInfo.id) {
                try {
                    const profileData = await userService.getProfileByUserId(userInfo.id);
                    if (profileData) {
                        console.log("AuthContext: Thông tin chi tiết người dùng từ API:", profileData);
                        setUserProfile(profileData);
                    }
                } catch (error) {
                    console.error("Lỗi khi lấy thông tin chi tiết người dùng:", error);
                }
            }
        }
    };

    const logout = () => {
        // Xóa tất cả các token khỏi localStorage
        localStorage.removeItem(TOKEN_STORAGE.ACCESS_TOKEN);
        localStorage.removeItem(TOKEN_STORAGE.REFRESH_TOKEN);
        localStorage.removeItem(TOKEN_STORAGE.TOKEN_EXPIRY);

        setIsLogin(false);
        setIsAdmin(false);
        setUser(null);
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider value={{ isLogin, isAdmin, user, userProfile, login, logout, refreshUserProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};