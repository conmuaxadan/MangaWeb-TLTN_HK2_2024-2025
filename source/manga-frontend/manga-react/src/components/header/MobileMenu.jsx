/**
 * Mobile Menu Component
 * Handles mobile navigation and search
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useSearch } from '../../hooks';
import SearchResults from './SearchResults.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faTags,
  faChevronUp,
  faChevronDown,
  faHistory,
  faHeart,
  faUser,
  faCog,
  faSignOutAlt,
  faSignInAlt,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons';

const MobileMenu = React.memo(({
  isLogin,
  genres,
  showGenresMobile,
  onToggleGenres,
  onMenuClose,
  onLogout
}) => {
  const scrollToTop = () => window.scrollTo(0, 0);

  const {
    searchKeyword,
    searchResults,
    isSearching,
    showResults,
    handleSearchInputChange,
    handleSearchSubmit,
    handleSearchFocus,
    hideResults
  } = useSearch();



  const handleLinkClick = () => {
    scrollToTop();
    onMenuClose();
  };

  const handleResultClick = () => {
    hideResults();
    scrollToTop();
    onMenuClose();
  };

  const handleSubmit = (e) => {
    const success = handleSearchSubmit(e);
    if (success) {
      hideResults();
      onMenuClose();
    }
  };

  return (
    <div className="md:hidden fixed left-0 top-16 w-full bg-white text-gray-800 shadow-lg z-50 transition-all duration-200 overflow-visible">
      {/* Mobile Search Bar */}
      <div className="px-4 py-3 border-b border-gray-200 relative overflow-visible">
        <div className="relative">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onFocus={handleSearchFocus}
              placeholder="Tìm kiếm truyện..."
              className="w-full bg-gray-100 text-gray-800 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </form>

          {/* Mobile search results dropdown */}
          {showResults && (
            <div className="absolute left-0 right-0 mt-1 bg-white rounded-md shadow-lg z-[9999] max-h-80 overflow-y-auto">
              <SearchResults
                isSearching={isSearching}
                searchResults={searchResults}
                searchKeyword={searchKeyword}
                onResultClick={handleResultClick}
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div>
        <Link
          to="/search"
          onClick={handleLinkClick}
          className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors"
        >
          <FontAwesomeIcon icon={faSearch} className="mr-2" />
          Tìm kiếm nâng cao
        </Link>

        {/* Genres Section */}
        <button
          onClick={onToggleGenres}
          className="block w-full text-left px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors"
        >
          <FontAwesomeIcon icon={faTags} className="mr-2" />
          Thể loại
          <FontAwesomeIcon
            icon={showGenresMobile ? faChevronUp : faChevronDown}
            className="ml-2 float-right mt-1"
          />
        </button>

        {showGenresMobile && (
          <div className="bg-gray-50 py-2 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-1">
              {genres.map((genre) => (
                <Link
                  key={genre.name}
                  to={`/genre/${genre.name}`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors truncate"
                  onClick={handleLinkClick}
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* User-specific links */}
        {isLogin && (
          <>
            <Link
              to="/profile/reading-history"
              onClick={handleLinkClick}
              className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors"
            >
              <FontAwesomeIcon icon={faHistory} className="mr-2" />
              Lịch sử đọc
            </Link>
            <Link
              to="/profile/favorites"
              onClick={handleLinkClick}
              className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors"
            >
              <FontAwesomeIcon icon={faHeart} className="mr-2" />
              Yêu thích
            </Link>
          </>
        )}
      </div>

      {/* Auth Section */}
      <div className="border-t border-gray-200">
        {isLogin ? (
          <>
            <Link
              to="/profile"
              onClick={handleLinkClick}
              className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors"
            >
              <FontAwesomeIcon icon={faUser} className="mr-2" />
              Trang cá nhân
            </Link>
            <Link
              to="/profile/settings"
              onClick={handleLinkClick}
              className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors"
            >
              <FontAwesomeIcon icon={faCog} className="mr-2" />
              Cài đặt
            </Link>
            <a
              href="#"
              onClick={onLogout}
              className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors"
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
              className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors"
            >
              <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
              Đăng nhập
            </Link>
            <Link
              to="/register"
              onClick={handleLinkClick}
              className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors"
            >
              <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </div>
  );
});

MobileMenu.displayName = 'MobileMenu';

export default MobileMenu;
