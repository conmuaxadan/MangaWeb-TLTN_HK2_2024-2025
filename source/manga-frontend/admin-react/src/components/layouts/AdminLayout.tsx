import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faUsers,
  faBook,
  faBookOpen,
  faTags,
  faComments,
  faChartBar,
  faSignOutAlt,
  faBars,
  faTimes,
  faUser,
  faUserShield,
  faKey
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', icon: faChartLine, label: 'Dashboard' },
    { path: '/admin/users', icon: faUsers, label: 'Quản lý người dùng' },
    { path: '/admin/roles', icon: faUserShield, label: 'Quản lý vai trò' },
    { path: '/admin/permissions', icon: faKey, label: 'Quản lý quyền hạn' },
    { path: '/admin/mangas', icon: faBook, label: 'Quản lý truyện' },
    { path: '/admin/chapters', icon: faBookOpen, label: 'Quản lý chapter' },
    { path: '/admin/genres', icon: faTags, label: 'Quản lý thể loại' },
    { path: '/admin/comments', icon: faComments, label: 'Quản lý bình luận' },
    { path: '/admin/statistics', icon: faChartBar, label: 'Thống kê chi tiết' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:w-64`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b dark:border-gray-700">
          <Link to="/admin" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-800 dark:text-white">MangaWeb Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 lg:hidden"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <nav className="px-4 py-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    location.pathname === item.path
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                      : ''
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex-shrink-0">
              {userProfile?.avatarUrl ? (
                <img
                  src={`http://localhost:8888/api/v1/upload/files/${userProfile.avatarUrl}`}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                  <FontAwesomeIcon icon={faUser} />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{userProfile?.displayName || user?.displayName || 'Admin'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">@{user?.username || ''}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{userProfile?.email || user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 lg:hidden"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
