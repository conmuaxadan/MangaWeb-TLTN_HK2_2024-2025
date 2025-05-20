import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import authService from "../services/auth-service";
import profileService from "../services/profile-service";
import { UserResponse } from "../interfaces/models/profile";
import { TOKEN_STORAGE } from "../configurations/api-config";

interface AuthContextType {
    isLogin: boolean;
    user: UserResponse | null;
    login: (authResponse: { token: string, refreshToken: string, expiresIn?: number }) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLogin, setIsLogin] = useState<boolean>(() => {
        return !!localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
    });
    const [user, setUser] = useState<UserResponse | null>(null);

    // Lấy thông tin người dùng khi đã đăng nhập
    useEffect(() => {
        const fetchUserInfo = async () => {
            if (isLogin) {
                // Lấy thông tin người dùng từ JWT token
                const tokenInfo = authService.getCurrentUser();
                if (tokenInfo) {
                    try {
                        // Sử dụng API mới để lấy thông tin người dùng từ identity service
                        const userInfo = await profileService.getUserById(tokenInfo.userId);
                        if (userInfo) {
                            // Chuyển đổi từ UserResponse sang UserProfileResponse
                            setUser({
                                id: userInfo.id,
                                username: userInfo.id,
                                email: userInfo.email,
                                displayName: userInfo.displayName || userInfo.username,
                                avatarUrl: userInfo.avatarUrl,
                                createdAt: userInfo.createdAt,
                            });
                        } else {
                            // Nếu không lấy được thông tin người dùng, tạo một profile tạm thời từ thông tin token
                            setUser({
                                id: tokenInfo.userId,
                                username: tokenInfo.userId,
                                email: tokenInfo.email,
                                displayName: tokenInfo.userId || tokenInfo.email.split('@')[0], // Tạo displayName từ username hoặc email
                                avatarUrl: "/images/avt_default.jpg"
                            });
                        }
                    } catch (error) {
                        console.error("Lỗi khi lấy thông tin profile:", error);
                        // Tạo profile tạm thời từ thông tin token
                        setUser({
                            id: tokenInfo.userId,
                            username: tokenInfo.userId,
                            email: tokenInfo.email,
                            displayName: tokenInfo.userId || tokenInfo.email.split('@')[0], // Tạo displayName từ username hoặc email
                            avatarUrl: "/images/avt_default.jpg"
                        });
                    }
                }
            }
        };

        fetchUserInfo();
    }, [isLogin]);

    const login = (authResponse: { token: string, refreshToken: string, expiresIn?: number }) => {
        // Lưu access token và refresh token
        localStorage.setItem(TOKEN_STORAGE.ACCESS_TOKEN, authResponse.token);
        localStorage.setItem(TOKEN_STORAGE.REFRESH_TOKEN, authResponse.refreshToken);

        // Lưu thời gian hết hạn nếu có
        if (authResponse.expiresIn) {
            const expiryTime = Date.now() + (authResponse.expiresIn * 1000);
            localStorage.setItem(TOKEN_STORAGE.TOKEN_EXPIRY, expiryTime.toString());
        }

        setIsLogin(true);
    };

    const logout = () => {
        authService.logout();
        setIsLogin(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isLogin, user, login, logout }}>
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