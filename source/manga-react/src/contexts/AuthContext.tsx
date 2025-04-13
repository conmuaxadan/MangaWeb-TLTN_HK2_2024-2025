import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import authService from "../services/auth-service";
import { UserResponse } from "../interfaces/models/auth";

interface AuthContextType {
    isLogin: boolean;
    user: UserResponse | null;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLogin, setIsLogin] = useState<boolean>(() => {
        return !!localStorage.getItem("token");
    });
    const [user, setUser] = useState<UserResponse | null>(null);

    // Lấy thông tin người dùng khi đã đăng nhập
    useEffect(() => {
        const fetchUserInfo = async () => {
            if (isLogin) {
                const userInfo = await authService.getCurrentUser();
                if (userInfo) {
                    setUser(userInfo);
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