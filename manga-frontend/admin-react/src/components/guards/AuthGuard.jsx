import {useEffect} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {TOKEN_STORAGE, isTokenExpired} from '../../configurations/api-config.js';
import authService from '../../services/auth-service.js';
import {useAuth} from '../../contexts/AuthContext.jsx';
import {toast} from 'react-toastify';

const AuthGuard = ({children, requireAuth}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const {hasMangaManagement, hasSystemManagement, hasTranslatorManagement, isLoading} = useAuth();

    useEffect(() => {
        // Không kiểm tra quyền khi đang loading để tránh việc đá về login khi reload
        if (isLoading) {
            return;
        }

        // Kiểm tra token trực tiếp từ localStorage
        const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(TOKEN_STORAGE.REFRESH_TOKEN);
        const hasToken = !!token;

        const checkTokenValidity = async () => {
            // Chỉ kiểm tra và làm mới token nếu người dùng đã đăng nhập
            if (hasToken) {
                // Nếu token đã hết hạn và có refresh token, thử làm mới token
                if (isTokenExpired() && refreshToken) {
                    console.log('Token đã hết hạn, đang làm mới token...');
                    const refreshResult = await authService.refreshToken();
                    // Nếu làm mới thất bại và route yêu cầu đăng nhập, chuyển hướng đến trang login
                    if (!refreshResult && requireAuth) {
                        console.log('Làm mới token thất bại, chuyển hướng đến trang login');
                        navigate('/login', {replace: true});
                        return;
                    }
                }

                // Kiểm tra quyền truy cập cho các trang admin
                const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/login';
                const isTranslatorRoute = location.pathname.startsWith('/translator');

                if (isAdminRoute) {
                    // Kiểm tra xem người dùng có ít nhất một trong các quyền admin không
                    const hasAdminPermission = hasMangaManagement || hasSystemManagement;

                    if (!hasAdminPermission) {
                        console.warn('Người dùng không có quyền truy cập trang admin:', location.pathname);

                        // Nếu là translator, chuyển hướng về trang translator thay vì logout
                        if (hasTranslatorManagement) {
                            toast.warning('Bạn không có quyền truy cập trang admin. Chuyển hướng về trang dịch giả.', {position: 'top-right'});
                            navigate('/translator/my-mangas', {replace: true});
                            return;
                        }

                        // Nếu không có quyền gì, mới logout
                        toast.error('Bạn không có quyền truy cập trang này. Vui lòng đăng nhập với tài khoản có quyền phù hợp.', {position: 'top-right'});
                        authService.logout();
                        navigate('/login', {replace: true});
                        return;
                    }
                }

                if (isTranslatorRoute) {
                    // Kiểm tra xem người dùng có quyền translator không
                    if (!hasTranslatorManagement) {
                        console.warn('Người dùng không có quyền truy cập trang translator:', location.pathname);
                        toast.error('Bạn không có quyền truy cập trang này. Cần quyền dịch giả.', {position: 'top-right'});
                        // Đăng xuất người dùng và chuyển hướng đến trang đăng nhập
                        authService.logout();
                        navigate('/login', {replace: true});
                        return;
                    }
                }

                // Kiểm tra quyền truy cập cụ thể cho từng trang admin
                if (isAdminRoute) {
                    const currentPath = location.pathname;

                    // Các trang yêu cầu quyền SYSTEM_MANAGEMENT
                    const systemManagementPages = ['/admin/dashboard', '/admin/users', '/admin/roles', '/admin/permissions', '/admin/comments', '/admin/statistics'];

                    // Các trang yêu cầu quyền MANGA_MANAGEMENT
                    const mangaManagementPages = ['/admin/mangas', '/admin/chapters', '/admin/genres'];

                    if (systemManagementPages.includes(currentPath) && !hasSystemManagement) {
                        console.warn('Người dùng không có quyền SYSTEM_MANAGEMENT cho trang:', currentPath);
                        toast.error('Bạn không có quyền truy cập trang này. Cần quyền Super Admin.', {position: 'top-right'});
                        navigate('/admin/mangas', {replace: true}); // Chuyển hướng đến trang manga management
                        return;
                    }

                    if (mangaManagementPages.includes(currentPath) && !hasMangaManagement && !hasSystemManagement) {
                        console.warn('Người dùng không có quyền MANGA_MANAGEMENT cho trang:', currentPath);
                        toast.error('Bạn không có quyền truy cập trang này. Cần quyền quản lý truyện.', {position: 'top-right'});
                        navigate('/login', {replace: true});
                        return;
                    }
                }

                // Chỉ chuyển hướng người dùng đã đăng nhập khỏi các trang login và register
                const authPages = ['/login', '/register', '/authenticate'];
                if (!requireAuth && authPages.includes(window.location.pathname)) {
                    navigate('/', {replace: true});
                    return;
                }
            } else {
                // Nếu không có token và route yêu cầu đăng nhập, chuyển hướng đến trang login
                if (requireAuth) {
                    console.log('Không có token, chuyển hướng đến trang login');
                    navigate('/login', {replace: true});
                    return;
                }
            }
        };

        checkTokenValidity();
    }, [navigate, requireAuth, location.pathname, hasMangaManagement, hasSystemManagement, hasTranslatorManagement, isLoading]);

    return <>{children}</>;
};

export default AuthGuard;
