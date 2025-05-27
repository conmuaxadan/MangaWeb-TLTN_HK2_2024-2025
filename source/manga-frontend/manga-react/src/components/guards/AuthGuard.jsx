import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOKEN_STORAGE, isTokenExpired } from '../../configurations/api-config.js';
import authService from '../../services/auth-service.js';

const AuthGuard = ({ children, requireAuth }) => {
  const navigate = useNavigate();

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
          const refreshResult = await authService.refreshToken();
          // Nếu làm mới thất bại và route yêu cầu đăng nhập, chuyển hướng đến trang login
          if (!refreshResult && requireAuth) {
            navigate('/login', { replace: true });
            return;
          }
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
          navigate('/login', { replace: true });
          return;
        }
      }
    };

    checkTokenValidity();
  }, [navigate, requireAuth]);

  return <>{children}</>;
};

export default AuthGuard;
