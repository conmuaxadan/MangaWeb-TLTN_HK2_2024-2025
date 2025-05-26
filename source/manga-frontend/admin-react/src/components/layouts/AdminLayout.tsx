import React, {useState, useMemo} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faUsers,
    faBook,
    faBookOpen,
    faTags,
    faComments,
    faChartBar,
    faSignOutAlt,
    faTimes,
    faUser,
    faUserShield,
    faKey
} from '@fortawesome/free-solid-svg-icons';
import {useAuth} from '../../contexts/AuthContext';
import {ILayout} from '../../interfaces/ILayout';

const AdminLayout: React.FC<ILayout> = ({children}) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const {user, userProfile, logout, hasMangaManagement, hasSystemManagement} = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Định nghĩa tất cả menu items
    const allMenuItems = [
        {path: '/admin/dashboard', icon: faChartLine, label: 'Tổng quan', permission: 'SYSTEM_MANAGEMENT'},
        {path: '/admin/users', icon: faUsers, label: 'Quản lý người dùng', permission: 'SYSTEM_MANAGEMENT'},
        {path: '/admin/roles', icon: faUserShield, label: 'Quản lý vai trò', permission: 'SYSTEM_MANAGEMENT'},
        {path: '/admin/permissions', icon: faKey, label: 'Quản lý quyền hạn', permission: 'SYSTEM_MANAGEMENT'},
        {path: '/admin/mangas', icon: faBook, label: 'Quản lý truyện', permission: 'MANGA_MANAGEMENT'},
        {path: '/admin/chapters', icon: faBookOpen, label: 'Quản lý chương', permission: 'MANGA_MANAGEMENT'},
        {path: '/admin/genres', icon: faTags, label: 'Quản lý thể loại', permission: 'MANGA_MANAGEMENT'},
        {path: '/admin/comments', icon: faComments, label: 'Quản lý bình luận', permission: 'SYSTEM_MANAGEMENT'},
        {path: '/admin/statistics', icon: faChartBar, label: 'Thống kê chi tiết', permission: 'SYSTEM_MANAGEMENT'},
    ];

    // Lọc menu items dựa trên quyền
    const menuItems = useMemo(() => {
        console.log("AdminLayout: hasMangaManagement:", hasMangaManagement);
        console.log("AdminLayout: hasSystemManagement:", hasSystemManagement);

        // Nếu có quyền SYSTEM_MANAGEMENT (Super Admin), hiển thị tất cả các menu
        if (hasSystemManagement) {
            return allMenuItems;
        }

        // Nếu chỉ có quyền MANGA_MANAGEMENT, chỉ hiển thị các menu liên quan đến quản lý truyện
        if (hasMangaManagement) {
            return allMenuItems.filter(item => item.permission === 'MANGA_MANAGEMENT');
        }

        // Nếu không có quyền nào, không hiển thị menu nào
        return [];
    }, [hasMangaManagement, hasSystemManagement]);

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
                        <FontAwesomeIcon icon={faTimes}/>
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
                                    <FontAwesomeIcon icon={item.icon} className="w-5 h-5 mr-3"/>
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
                                <div
                                    className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                                    <FontAwesomeIcon icon={faUser}/>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{userProfile?.displayName || ''}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">@{user?.username || ''}</p>
                            {/* Badge hiển thị quyền */}
                            <div className="mt-1">
                                {hasSystemManagement ? (
                                    <span
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Admin
                  </span>
                                ) : hasMangaManagement ? (
                                    <span
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Quản lý truyện
                  </span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5 mr-3"/>
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

