import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TOKEN_STORAGE, isTokenExpired } from '../../configurations/api-config';
import authService from '../../services/auth-service';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth: boolean;
}

const AuthGuard = ({ children, requireAuth }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  useEffect(() => {
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
            navigate('/login', { replace: true });
            return;
          }
        }

        // Kiểm tra quyền admin cho các trang admin
        const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/login';
        if (isAdminRoute && !isAdmin) {
          // Thử lấy thông tin người dùng từ token trước khi chuyển hướng
          const userInfo = authService.getMyInfo();
          if (userInfo && userInfo.roles && userInfo.roles.some(role => role.name.includes('ROLE_ADMIN'))) {
            // Nếu token có quyền admin, không chuyển hướng
            console.log('Token có quyền admin, cho phép truy cập');
            return;
          }

          console.warn('Người dùng không có quyền admin nhưng đang cố truy cập trang admin:', location.pathname);
          toast.error('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.', { position: 'top-right' });
          // Đăng xuất người dùng và chuyển hướng đến trang đăng nhập
          authService.logout();
          navigate('/login', { replace: true });
          return;
        }

        // Chỉ chuyển hướng người dùng đã đăng nhập khỏi các trang login và register
        const authPages = ['/login', '/register', '/authenticate'];
        if (!requireAuth && authPages.includes(window.location.pathname)) {
          navigate('/', { replace: true });
          return;
        }
      } else {
        // Nếu không có token và route yêu cầu đăng nhập, chuyển hướng đến trang login
        if (requireAuth) {
          console.log('Không có token, chuyển hướng đến trang login');
          navigate('/login', { replace: true });
          return;
        }
      }
    };

    checkTokenValidity();
  }, [navigate, requireAuth, location.pathname, isAdmin]);

  return <>{children}</>;
};

export default AuthGuard;
