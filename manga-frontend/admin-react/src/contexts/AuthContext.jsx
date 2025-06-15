import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/auth-service.js";
import userService from "../services/user-service.js";
import { TOKEN_STORAGE } from "../configurations/api-config.js";

const AuthContext = createContext(undefined);

// Hàm helper để parse permissions từ token
const parseTokenPermissions = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        const permissions = payload.scope ? payload.scope.split(' ') : [];

        return {
            permissions,
            hasMangaManagement: permissions.includes('MANGA_MANAGEMENT'),
            hasSystemManagement: permissions.includes('SYSTEM_MANAGEMENT'),
            hasTranslatorManagement: permissions.includes('TRANSLATOR_MANAGEMENT')
        };
    } catch (error) {
        console.error("Lỗi khi parse token:", error);
        return {
            permissions: [],
            hasMangaManagement: false,
            hasSystemManagement: false,
            hasTranslatorManagement: false
        };
    }
};

export const AuthProvider = ({ children }) => {
    // Khởi tạo state với thông tin từ token nếu có
    const [isLogin, setIsLogin] = useState(() => {
        return !!localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
    });

    const [hasMangaManagement, setHasMangaManagement] = useState(() => {
        const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
        if (token) {
            const { hasMangaManagement } = parseTokenPermissions(token);
            return hasMangaManagement;
        }
        return false;
    });

    const [hasSystemManagement, setHasSystemManagement] = useState(() => {
        const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
        if (token) {
            const { hasSystemManagement } = parseTokenPermissions(token);
            return hasSystemManagement;
        }
        return false;
    });

    const [hasTranslatorManagement, setHasTranslatorManagement] = useState(() => {
        const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
        if (token) {
            const { hasTranslatorManagement } = parseTokenPermissions(token);
            return hasTranslatorManagement;
        }
        return false;
    });

    const [userPermissions, setUserPermissions] = useState(() => {
        const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
        if (token) {
            const { permissions } = parseTokenPermissions(token);
            return permissions;
        }
        return [];
    });

    const [user, setUser] = useState(() => {
        const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
        if (token) {
            return authService.getMyInfo();
        }
        return null;
    });

    const [userProfile, setUserProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Hàm kiểm tra quyền cụ thể
    const hasPermission = (permission) => {
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

    const login = (authResponse) => {
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
        const { permissions, hasMangaManagement: hasMangaManagementPerm, hasSystemManagement: hasSystemManagementPerm, hasTranslatorManagement: hasTranslatorManagementPerm } = parseTokenPermissions(authResponse.token);

        setUserPermissions(permissions);
        setHasMangaManagement(hasMangaManagementPerm);
        setHasSystemManagement(hasSystemManagementPerm);
        setHasTranslatorManagement(hasTranslatorManagementPerm);

        console.log("AuthContext: Quyền của người dùng:", permissions);
        console.log("AuthContext: Có quyền MANGA_MANAGEMENT:", hasMangaManagementPerm);
        console.log("AuthContext: Có quyền SYSTEM_MANAGEMENT:", hasSystemManagementPerm);
        console.log("AuthContext: Có quyền TRANSLATOR_MANAGEMENT:", hasTranslatorManagementPerm);
    };

    const logout = async () => {
        try {
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
        setHasTranslatorManagement(false);
        setUserPermissions([]);
        setUser(null);
        setUserProfile(null);
        setIsLoading(false);
    };

    const getRedirectPath = () => {
        if (hasSystemManagement) {
            return '/admin/dashboard';
        } else if (hasTranslatorManagement) {
            return '/translator/my-mangas';
        } else {
            return '/login';
        }
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
                hasTranslatorManagement,
                userPermissions,
                user,
                userProfile,
                isLoading,
                login,
                logout,
                refreshUserProfile,
                hasPermission,
                getRedirectPath
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
