import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DefaultRedirect = () => {
  const navigate = useNavigate();
  const { hasMangaManagement, hasSystemManagement } = useAuth();

  useEffect(() => {
    // Nếu có quyền SYSTEM_MANAGEMENT (Super Admin), chuyển hướng đến trang tổng quan
    if (hasSystemManagement) {
      navigate('/admin/dashboard', { replace: true });
    }
    // Nếu chỉ có quyền MANGA_MANAGEMENT, chuyển hướng đến trang quản lý truyện
    else if (hasMangaManagement) {
      navigate('/admin/mangas', { replace: true });
    }
    // Nếu không có quyền nào, chuyển hướng đến trang login
    else {
      navigate('/login', { replace: true });
    }
  }, [navigate, hasMangaManagement, hasSystemManagement]);

  return null; // Component này không render gì cả
};

export default DefaultRedirect;
