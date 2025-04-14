import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth: boolean;
}

const AuthGuard = ({ children, requireAuth }: AuthGuardProps) => {
  const { isLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra token trực tiếp từ localStorage
    const token = localStorage.getItem('token');
    const hasToken = !!token;

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
  }, [navigate, requireAuth]);

  return <>{children}</>;
};

export default AuthGuard;
