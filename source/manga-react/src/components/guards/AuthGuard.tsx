import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOKEN_STORAGE, isTokenExpired } from '../../configurations/api-config';
import authService from '../../services/auth-service';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth: boolean;
}

const AuthGuard = ({ children, requireAuth }: AuthGuardProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra token trực tiếp từ localStorage
    const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(TOKEN_STORAGE.REFRESH_TOKEN);
    const hasToken = !!token;

    const checkTokenValidity = async () => {
      // Nếu có token và token đã hết hạn và có refresh token
      if (hasToken && isTokenExpired() && refreshToken) {
        // Thử làm mới token
        const refreshResult = await authService.refreshToken();
        if (!refreshResult) {
          // Nếu làm mới thất bại và route yêu cầu đăng nhập
          if (requireAuth) {
            navigate('/login', { replace: true });
            return;
          }
        }
      }

      // Nếu route yêu cầu đăng nhập và không có token
      if (requireAuth && !hasToken) {
        navigate('/login', { replace: true });
        return;
      }

      // Chỉ chuyển hướng người dùng đã đăng nhập khỏi các trang login và register
      const authPages = ['/login', '/register', '/authenticate'];
      if (!requireAuth && hasToken && authPages.includes(window.location.pathname)) {
        navigate('/', { replace: true });
      }
    };

    checkTokenValidity();
  }, [navigate, requireAuth]);

  return <>{children}</>;
};

export default AuthGuard;
