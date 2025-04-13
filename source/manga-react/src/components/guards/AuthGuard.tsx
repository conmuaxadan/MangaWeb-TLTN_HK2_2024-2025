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
    
    // Nếu route không cho phép người dùng đã đăng nhập (như trang login) và người dùng đã đăng nhập
    if (!requireAuth && isLogin) {
      navigate('/', { replace: true });
    }
  }, [isLogin, navigate, requireAuth]);

  return <>{children}</>;
};

export default AuthGuard;
