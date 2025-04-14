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
    // Nếu route yêu cầu đăng nhập và người dùng chưa đăng nhập
    if (requireAuth && !isLogin) {
      navigate('/login', { replace: true });
    }

    // Chỉ chuyển hướng người dùng đã đăng nhập khỏi các trang login và register
    const authPages = ['/login', '/register', '/authenticate'];
    if (!requireAuth && isLogin && authPages.includes(window.location.pathname)) {
      navigate('/', { replace: true });
    }
  }, [isLogin, navigate, requireAuth]);

  return <>{children}</>;
};

export default AuthGuard;
