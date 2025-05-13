import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import authService from "../services/auth-service";
import profileService from "../services/profile-service";
import { TOKEN_STORAGE } from "../configurations/api-config";
import { UserResponse } from "../interfaces/models/auth";
import { UserProfileResponse } from "../interfaces/models/profile";

interface AuthContextType {
    isLogin: boolean;
    user: UserResponse | null;
    userProfile: UserProfileResponse | null;
    login: (authResponse: { token: string, refreshToken: string, expiresIn?: number }) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLogin, setIsLogin] = useState<boolean>(() => {
        return !!localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
    });
    const [user, setUser] = useState<UserResponse | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);

    // Lấy thông tin người dùng khi đã đăng nhập
    useEffect(() => {
        const fetchUserInfo = async () => {
            if (isLogin) {
                // Lấy thông tin cơ bản của người dùng từ token JWT
                const userInfo = authService.getMyInfo();
                if (userInfo) {
                    setUser(userInfo);

                    // Lấy thông tin chi tiết của người dùng từ profile service
                    try {
                        const profileInfo = await profileService.getProfileByUserId(userInfo.id);
                        if (profileInfo) {
                            setUserProfile(profileInfo);
                        }
                    } catch (profileError) {
                        console.error("Lỗi khi lấy thông tin profile:", profileError);
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

        // Sau khi đăng nhập, lấy thông tin người dùng từ token JWT
        const userInfo = authService.getMyInfo();
        if (userInfo) {
            setUser(userInfo);

            // Lấy thông tin chi tiết của người dùng từ profile service
            profileService.getProfileByUserId(userInfo.id).then(profileInfo => {
                if (profileInfo) {
                    setUserProfile(profileInfo);
                }
            }).catch(profileError => {
                console.error("Lỗi khi lấy thông tin profile:", profileError);
            });
        }
    };

    const logout = () => {
        // Xóa tất cả các token khỏi localStorage
        localStorage.removeItem(TOKEN_STORAGE.ACCESS_TOKEN);
        localStorage.removeItem(TOKEN_STORAGE.REFRESH_TOKEN);
        localStorage.removeItem(TOKEN_STORAGE.TOKEN_EXPIRY);

        setIsLogin(false);
        setUser(null);
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider value={{ isLogin, user, userProfile, login, logout }}>
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