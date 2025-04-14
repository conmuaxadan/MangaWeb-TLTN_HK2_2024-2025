import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import authService from "../services/auth-service";
import profileService from "../services/profile-service";
import { UserResponse } from "../interfaces/models/auth";
import { UserProfileResponse } from "../interfaces/models/profile";

interface AuthContextType {
    isLogin: boolean;
    user: UserProfileResponse | null;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLogin, setIsLogin] = useState<boolean>(() => {
        return !!localStorage.getItem("token");
    });
    const [user, setUser] = useState<UserProfileResponse | null>(null);

    // Lấy thông tin người dùng khi đã đăng nhập
    useEffect(() => {
        const fetchUserInfo = async () => {
            if (isLogin) {
                // Lấy thông tin người dùng từ JWT token
                const tokenInfo = authService.getCurrentUser();
                if (tokenInfo) {
                    try {
                        // Sử dụng userId từ token để lấy thông tin profile
                        const userProfile = await profileService.getUserProfileByUserId(tokenInfo.userId);
                        if (userProfile) {
                            setUser(userProfile);
                        } else {
                            // Nếu không lấy được thông tin profile, tạo một profile tạm thời từ thông tin token
                            setUser({
                                id: "",
                                userId: tokenInfo.userId,
                                email: tokenInfo.email,
                                displayName: tokenInfo.email.split('@')[0], // Tạo displayName từ email
                                avatarUrl: null
                            });
                        }
                    } catch (error) {
                        console.error("Lỗi khi lấy thông tin profile:", error);
                        // Tạo profile tạm thời từ thông tin token
                        setUser({
                            id: "",
                            userId: tokenInfo.userId,
                            email: tokenInfo.email,
                            displayName: tokenInfo.email.split('@')[0], // Tạo displayName từ email
                            avatarUrl: null
                        });
                    }
                }
            }
        };

        fetchUserInfo();
    }, [isLogin]);

    const login = (token: string) => {
        localStorage.setItem("token", token);
        setIsLogin(true);
    };

    const logout = () => {
        localStorage.removeItem("token");
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