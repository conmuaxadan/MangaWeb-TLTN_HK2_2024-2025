/**
 * Optimized Header Component
 * Split into smaller components with custom hooks for better performance
 */

import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useMenu } from '../hooks/useMenu.js';
import { useGenres } from '../hooks/index.js';
import { useScrollHeader } from '../hooks/index.js';
import { preventRapidClicks } from '../utils/performance.js';
import SearchBar from './header/SearchBar.jsx';
import MobileMenu from './header/MobileMenu.jsx';
import DesktopMenu from './header/DesktopMenu.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBars } from '@fortawesome/free-solid-svg-icons';

const Header = React.memo(() => {
  const { isLogin, logout, user } = useAuth();
  const { isScrolled } = useScrollHeader();
  const { genres } = useGenres();
  const {
    isMenuOpen,
    showGenresMobile,
    menuRef,
    toggleMenu,
    closeMenu,
    toggleGenresMobile
  } = useMenu();

  // Optimized logout handler with rapid click prevention
  const handleLogout = useCallback(
    preventRapidClicks(async (e) => {
      e.preventDefault();
      try {
        await logout();
        // Chuyển hướng về trang chủ sau khi đăng xuất
        window.location.href = '/';
      } catch (error) {
        console.error('Header: Lỗi khi logout:', error);
      }
      closeMenu();
      window.scrollTo(0, 0);
    }),
    [logout, closeMenu]
  );

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <span className="text-gray-900 font-bold text-xl tracking-tight">
                R-Manga
              </span>
            </Link>
          </div>

          {/* Desktop Search Bar - Vừa phải */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
            <SearchBar />
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* Username display when logged in (desktop only) */}
            {isLogin && user && (
              <div className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <FontAwesomeIcon icon={faUser} className="text-sm" />
                <span className="text-xs font-medium truncate max-w-[100px]">
                  {user.displayName}
                </span>
              </div>
            )}

            {/* Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={toggleMenu}
                className="w-10 h-10 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors flex items-center justify-center"
                aria-label="User menu"
              >
                <FontAwesomeIcon icon={faBars} className="text-lg" />
              </button>

              {/* Menu Dropdowns */}
              {isMenuOpen && (
                <>
                  {/* Mobile Menu */}
                  <MobileMenu
                    isLogin={isLogin}
                    genres={genres}
                    showGenresMobile={showGenresMobile}
                    onToggleGenres={toggleGenresMobile}
                    onMenuClose={closeMenu}
                    onLogout={handleLogout}
                  />

                  {/* Desktop Menu */}
                  <DesktopMenu
                    isLogin={isLogin}
                    onMenuClose={closeMenu}
                    onLogout={handleLogout}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
