import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCog, faSignOutAlt, faHeart, faHistory, faLink } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { getAvatarUrl } from '../../utils/file-utils';

interface ProfileLayoutProps {
  children: ReactNode;
}

const ProfileLayout: React.FC<ProfileLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [prevPathname, setPrevPathname] = useState<string>(location.pathname);

  // Hàm xử lý cuộn lên đầu trang
  const scrollToTop = () => {
    // Cuộn lên đầu trang ngay lập tức
    window.scrollTo(0, 0);

    // Cuộn lên đầu phần nội dung ngay lập tức
    const contentElement = document.getElementById('profile-content');
    if (contentElement) {
      contentElement.scrollTop = 0;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Không cần hàm isActive nữa vì đã sử dụng NavLink

  return (
    <section className="relative pb-16 lg:pb-24 bg-gray-100 text-gray-900 min-h-screen">
      {/* Banner đã được xóa */}

      <div className="container relative mx-auto px-4">
        <div className="md:flex">
          {/* Sidebar */}
          <div className="md:w-1/3 md:px-3 lg:w-1/4">
            <div className="relative mt-6">
              <div className="rounded-md bg-white p-6 shadow">
                <div className="profile-pic mb-5 text-center">
                  <div>
                    <div className="relative mx-auto size-28">
                      <img
                        src={getAvatarUrl(user?.avatarUrl)}
                        className="h-full w-full rounded-full shadow ring-4 ring-gray-200"
                        id="profile-image"
                        alt="Profile"
                      />
                    </div>
                    <div className="mt-4">
                      <h5 className="text-lg font-semibold">{user?.displayName || 'User'}</h5>
                      <p className="text-gray-500">{user?.email || ''}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200">
                  <ul className="sidebar-nav mb-0 mt-3 list-none">
                    <li className="navbar-item account-menu">
                      <NavLink
                        to="/profile"
                        end
                        onClick={scrollToTop}
                        className={({isActive}) => `navbar-link flex items-center rounded py-2 ${isActive ? 'text-purple-600 font-medium' : 'text-gray-500'} hover:text-gray-900`}
                      >
                        <span className="mb-0 mr-2 text-[18px]">
                          <FontAwesomeIcon icon={faUser} />
                        </span>
                        <h6 className="mb-0 font-semibold">Thông tin chung</h6>
                      </NavLink>
                    </li>
                    <li className="navbar-item account-menu">
                      <NavLink
                        to="/profile/favorites"
                        onClick={scrollToTop}
                        className={({isActive}) => `navbar-link flex items-center rounded py-2 ${isActive ? 'text-purple-600 font-medium' : 'text-gray-500'} hover:text-gray-900`}
                      >
                        <span className="mb-0 mr-2 text-[18px]">
                          <FontAwesomeIcon icon={faHeart} />
                        </span>
                        <h6 className="mb-0 font-semibold">Yêu thích</h6>
                      </NavLink>
                    </li>
                    <li className="navbar-item account-menu">
                      <NavLink
                        to="/profile/reading-history"
                        onClick={scrollToTop}
                        className={({isActive}) => `navbar-link flex items-center rounded py-2 ${isActive ? 'text-purple-600 font-medium' : 'text-gray-500'} hover:text-gray-900`}
                      >
                        <span className="mb-0 mr-2 text-[18px]">
                          <FontAwesomeIcon icon={faHistory} />
                        </span>
                        <h6 className="mb-0 font-semibold">Lịch sử đọc</h6>
                      </NavLink>
                    </li>
                    <li className="navbar-item account-menu">
                      <NavLink
                        to="/profile/linked-accounts"
                        onClick={scrollToTop}
                        className={({isActive}) => `navbar-link flex items-center rounded py-2 ${isActive ? 'text-purple-600 font-medium' : 'text-gray-500'} hover:text-gray-900`}
                      >
                        <span className="mb-0 mr-2 text-[18px]">
                          <FontAwesomeIcon icon={faLink} />
                        </span>
                        <h6 className="mb-0 font-semibold">Tài khoản liên kết</h6>
                      </NavLink>
                    </li>
                    <li className="navbar-item account-menu">
                      <NavLink
                        to="/profile/settings"
                        onClick={scrollToTop}
                        className={({isActive}) => `navbar-link flex items-center rounded py-2 ${isActive ? 'text-purple-600 font-medium' : 'text-gray-500'} hover:text-gray-900`}
                      >
                        <span className="mb-0 mr-2 text-[18px]">
                          <FontAwesomeIcon icon={faCog} />
                        </span>
                        <h6 className="mb-0 font-semibold">Cài đặt</h6>
                      </NavLink>
                    </li>
                    <li className="navbar-item account-menu">
                      <button
                        onClick={handleLogout}
                        className="navbar-link flex items-center rounded py-2 text-gray-500 hover:text-gray-900 w-full text-left"
                      >
                        <span className="mb-0 mr-2 text-[18px]">
                          <FontAwesomeIcon icon={faSignOutAlt} />
                        </span>
                        <h6 className="mb-0 font-semibold">Đăng xuất</h6>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div id="profile-content" className="mt-6 md:mt-6 md:w-2/3 md:px-3 lg:w-3/4 overflow-auto transition-all duration-300">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileLayout;
