import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/auth-service';

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login, isLogin, isAdmin } = useAuth();

  // Nếu đã đăng nhập và có quyền admin, chuyển hướng đến trang dashboard
  useEffect(() => {
    if (isLogin) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        // Không hiển thị thông báo về quyền, chỉ đăng xuất người dùng
        authService.logout();
      }
    }
  }, [isLogin, isAdmin, navigate]);

  // Animation effect khi component mount
  useEffect(() => {
    document.querySelector('.login-container')?.classList.add('fade-in');
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Kiểm tra các trường dữ liệu
    if (!username || !password) {
      toast.error('Vui lòng điền đầy đủ thông tin', { position: 'top-right' });
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.login(username, password);

      if (response !== false) {
        // Đăng nhập thành công, kiểm tra quyền admin
        login({
          token: response.token,
          refreshToken: response.refreshToken,
          expiresIn: response.expiresIn
        });

        // Kiểm tra quyền admin từ token
        try {
          const base64Url = response.token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));

          const payload = JSON.parse(jsonPayload);
          const hasAdminRole = payload.scope && payload.scope.includes('ROLE_ADMIN');

          if (hasAdminRole) {
            toast.success('Đăng nhập thành công!', { position: 'top-right' });
            navigate('/admin');
          } else {
            // Không hiển thị thông báo về quyền, chỉ thông báo sai thông tin đăng nhập
            toast.error('Sai thông tin đăng nhập. Vui lòng kiểm tra lại tên đăng nhập và mật khẩu.', { position: 'top-right' });
            // Đăng xuất người dùng không có quyền admin
            authService.logout();
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra quyền admin:', error);
          toast.error('Đã xảy ra lỗi khi kiểm tra quyền. Vui lòng thử lại sau.', { position: 'top-right' });
          authService.logout();
        }
      } else {
        toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.', { position: 'top-right' });
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại sau.', { position: 'top-right' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .login-container {
          opacity: 0;
        }
      `}</style>

      <div className="login-container w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                MangaWeb Admin
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Đăng nhập để quản lý hệ thống
              </p>
            </div>



            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Nhập tên đăng nhập"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <FontAwesomeIcon
                      icon={showPassword ? faEyeSlash : faEye}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    />
                  </button>
                </div>
              </div>

              {/* Login button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : 'Đăng nhập'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} MangaWeb Admin. Bản quyền thuộc về MangaWeb.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
