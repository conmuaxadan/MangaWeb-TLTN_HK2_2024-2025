/**
 * Desktop Menu Component
 * Handles desktop dropdown menu
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faHistory, faHeart, faCog, faSignOutAlt, faSignInAlt, faUserPlus } from '@fortawesome/free-solid-svg-icons';

interface DesktopMenuProps {
  isLogin: boolean;
  onMenuClose: () => void;
  onLogout: (e: React.MouseEvent) => void;
}

const DesktopMenu = React.memo<DesktopMenuProps>(({
  isLogin,
  onMenuClose,
  onLogout
}) => {
  const scrollToTop = () => window.scrollTo(0, 0);

  const handleLinkClick = () => {
    scrollToTop();
    onMenuClose();
  };

  return (
    <div className="hidden md:block absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50 transition-all duration-200">
      {isLogin ? (
        <>
          <Link
            to="/profile"
            onClick={handleLinkClick}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <FontAwesomeIcon icon={faUser} className="mr-2" />
            Trang cá nhân
          </Link>
          <Link
            to="/profile/reading-history"
            onClick={handleLinkClick}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <FontAwesomeIcon icon={faHistory} className="mr-2" />
            Lịch sử đọc
          </Link>
          <Link
            to="/profile/favorites"
            onClick={handleLinkClick}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <FontAwesomeIcon icon={faHeart} className="mr-2" />
            Yêu thích
          </Link>
          <Link
            to="/profile/settings"
            onClick={handleLinkClick}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <FontAwesomeIcon icon={faCog} className="mr-2" />
            Cài đặt
          </Link>
          <div className="border-t border-gray-100 my-1"></div>
          <a
            href="#"
            onClick={onLogout}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
            Đăng xuất
          </a>
        </>
      ) : (
        <>
          <Link
            to="/login"
            onClick={handleLinkClick}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
            Đăng nhập
          </Link>
          <Link
            to="/register"
            onClick={handleLinkClick}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
            Đăng ký
          </Link>
        </>
      )}
    </div>
  );
});

DesktopMenu.displayName = 'DesktopMenu';

export default DesktopMenu;
