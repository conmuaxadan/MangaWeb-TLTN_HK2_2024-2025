import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import authService from "../services/auth-service";
import userService from "../services/user-service";
import { TOKEN_STORAGE } from "../configurations/api-config";
import { UserResponse } from "../interfaces/models/auth";

interface AuthContextType {
    isLogin: boolean;
    hasMangaManagement: boolean;
    hasSystemManagement: boolean;
    userPermissions: string[];
    user: UserResponse | null;
    userProfile: UserResponse | null;
    isLoading: boolean;
    login: (authResponse: { token: string, refreshToken: string, expiresIn?: number }) => void;
    logout: () => Promise<void>;
    refreshUserProfile: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hàm helper để parse permissions từ token
const parseTokenPermissions = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        const permissions: string[] = payload.scope ? payload.scope.split(' ') : [];

        return {
            permissions,
            hasMangaManagement: permissions.includes('MANGA_MANAGEMENT'),
            hasSystemManagement: permissions.includes('SYSTEM_MANAGEMENT')
        };
    } catch (error) {
        console.error("Lỗi khi parse token:", error);
        return {
            permissions: [],
            hasMangaManagement: false,
            hasSystemManagement: false
        };
    }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // Khởi tạo state với thông tin từ token nếu có
    const [isLogin, setIsLogin] = useState<boolean>(() => {
        return !!localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
    });

    const [hasMangaManagement, setHasMangaManagement] = useState<boolean>(() => {
        const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
        if (token) {
            const { hasMangaManagement } = parseTokenPermissions(token);
            return hasMangaManagement;
        }
        return false;
    });

    const [hasSystemManagement, setHasSystemManagement] = useState<boolean>(() => {
        const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
        if (token) {
            const { hasSystemManagement } = parseTokenPermissions(token);
            return hasSystemManagement;
        }
        return false;
    });

    const [userPermissions, setUserPermissions] = useState<string[]>(() => {
        const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
        if (token) {
            const { permissions } = parseTokenPermissions(token);
            return permissions;
        }
        return [];
    });

    const [user, setUser] = useState<UserResponse | null>(() => {
        const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
        if (token) {
            return authService.getMyInfo();
        }
        return null;
    });

    const [userProfile, setUserProfile] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Hàm kiểm tra quyền cụ thể
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Lấy thông tin chi tiết người dùng khi đã đăng nhập
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (isLogin && user && user.id) {
                setIsLoading(true);
                try {
                    const profileData = await userService.getProfileByUserId(user.id);
                    if (profileData) {
                        console.log("AuthContext: Thông tin chi tiết người dùng từ API:", profileData);
                        setUserProfile(profileData);
                    }
                } catch (error) {
                    console.error("AuthContext: Lỗi khi lấy thông tin chi tiết người dùng:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchUserProfile();
    }, [isLogin, user]);

    const login = (authResponse: { token: string, refreshToken: string, expiresIn?: number }) => {
        // Lưu token vào localStorage
        localStorage.setItem(TOKEN_STORAGE.ACCESS_TOKEN, authResponse.token);
        localStorage.setItem(TOKEN_STORAGE.REFRESH_TOKEN, authResponse.refreshToken);

        if (authResponse.expiresIn) {
            const expiryTime = Date.now() + authResponse.expiresIn * 1000;
            localStorage.setItem(TOKEN_STORAGE.TOKEN_EXPIRY, expiryTime.toString());
        }

        setIsLogin(true);

        // Lấy thông tin người dùng từ token
        const userInfo = authService.getMyInfo();
        if (userInfo) {
            console.log("AuthContext: Thông tin người dùng từ token:", userInfo);
            setUser(userInfo);
        }

        // Parse permissions từ token
        const { permissions, hasMangaManagement: hasMangaManagementPerm, hasSystemManagement: hasSystemManagementPerm } = parseTokenPermissions(authResponse.token);

        setUserPermissions(permissions);
        setHasMangaManagement(hasMangaManagementPerm);
        setHasSystemManagement(hasSystemManagementPerm);

        console.log("AuthContext: Quyền của người dùng:", permissions);
        console.log("AuthContext: Có quyền MANGA_MANAGEMENT:", hasMangaManagementPerm);
        console.log("AuthContext: Có quyền SYSTEM_MANAGEMENT:", hasSystemManagementPerm);
    };

    const logout = async () => {
        try {
            // Gọi API logout để revoke token trên server
            await authService.logout();
        } catch (error) {
            console.error('AuthContext: Lỗi khi gọi API logout:', error);
            // Tiếp tục logout ở client ngay cả khi API thất bại
        }

        // Xóa tất cả các token khỏi localStorage
        localStorage.removeItem(TOKEN_STORAGE.ACCESS_TOKEN);
        localStorage.removeItem(TOKEN_STORAGE.REFRESH_TOKEN);
        localStorage.removeItem(TOKEN_STORAGE.TOKEN_EXPIRY);

        setIsLogin(false);
        setHasMangaManagement(false);
        setHasSystemManagement(false);
        setUserPermissions([]);
        setUser(null);
        setUserProfile(null);
        setIsLoading(false);
    };

    const refreshUserProfile = async () => {
        if (isLogin) {
            try {
                const myProfile = await userService.getMyProfile();
                if (myProfile) {
                    console.log("AuthContext: Profile người dùng (refresh):", myProfile);
                    setUserProfile(myProfile);
                }
                return;
            } catch (error) {
                console.error("AuthContext: Lỗi khi refresh profile người dùng:", error);
            }
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isLogin,
                hasMangaManagement,
                hasSystemManagement,
                userPermissions,
                user,
                userProfile,
                isLoading,
                login,
                logout,
                refreshUserProfile,
                hasPermission
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

