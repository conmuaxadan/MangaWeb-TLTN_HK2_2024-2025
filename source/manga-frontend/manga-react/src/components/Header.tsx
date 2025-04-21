import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '@fortawesome/fontawesome-free/css/all.min.css';

const NewHeader = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isLogin, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Theo dõi scroll để thay đổi màu nền header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Xử lý click bên ngoài menu để đóng menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus vào input khi mở search
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`);
      setIsSearchOpen(false);
      setSearchKeyword('');
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Header */}
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-900/95 backdrop-blur-md shadow-md' : 'bg-gray-900'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <span className="text-white font-bold text-xl tracking-tight">R-Manga</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/') ? 'text-white bg-gray-800' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
              >
                <i className="fas fa-home mr-2"></i>
                Trang chủ
              </Link>
              <Link
                to="/search"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/search') ? 'text-white bg-gray-800' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
              >
                <i className="fas fa-search mr-2"></i>
                Tìm kiếm
              </Link>
              <Link
                to="/profile/reading-history"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/profile/reading-history') ? 'text-white bg-gray-800' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
              >
                <i className="fas fa-history mr-2"></i>
                Lịch sử
              </Link>
              <Link
                to="/genres"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/genres') ? 'text-white bg-gray-800' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
              >
                <i className="fas fa-tags mr-2"></i>
                Thể loại
              </Link>
              <Link
                to="/rankings"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/rankings') ? 'text-white bg-gray-800' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
              >
                <i className="fas fa-trophy mr-2"></i>
                Xếp hạng
              </Link>
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              {/* Search button (mobile only) */}
              <button
                onClick={handleSearchClick}
                className="md:hidden w-10 h-10 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors flex items-center justify-center"
                aria-label="Search"
              >
                <i className="fas fa-search"></i>
              </button>

              {/* Username display when logged in */}
              {isLogin && user && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                  <i className="fas fa-user"></i>
                  <span className="text-sm font-medium truncate max-w-[120px]">{user.displayName}</span>
                </div>
              )}

              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={handleMenuClick}
                  className="w-10 h-10 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors flex items-center justify-center"
                  aria-label="User menu"
                >
                  <i className="fas fa-bars"></i>
                </button>

                {/* Dropdown menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 py-1 z-50 transition-all duration-200">
                    {!isLogin ? (
                      <>
                        <Link to="/login" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                          <i className="fas fa-sign-in-alt mr-2"></i>
                          Đăng nhập
                        </Link>
                        <Link to="/register" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                          <i className="fas fa-user-plus mr-2"></i>
                          Đăng ký
                        </Link>
                      </>
                    ) : (
                      <>
                        {/* Mobile username display */}
                        <div className="md:hidden px-4 py-3 text-sm text-white bg-gray-700 border-b border-gray-600 flex items-center gap-2">
                          <i className="fas fa-user text-lg"></i>
                          <span className="font-medium truncate">{user?.displayName}</span>
                        </div>
                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                          <i className="fas fa-user mr-2"></i>
                          Trang cá nhân
                        </Link>
                        <Link to="/profile/favorites" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                          <i className="fas fa-heart mr-2"></i>
                          Truyện yêu thích
                        </Link>
                        <Link to="/profile/reading-history" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                          <i className="fas fa-history mr-2"></i>
                          Lịch sử đọc
                        </Link>
                        <Link to="/profile/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                          <i className="fas fa-cog mr-2"></i>
                          Cài đặt
                        </Link>
                        <div className="border-t border-gray-700 my-1"></div>
                        <a href="#" onClick={handleLogout} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                          <i className="fas fa-sign-out-alt mr-2"></i>
                          Đăng xuất
                        </a>
                      </>
                    )}
                    <div className="md:hidden border-t border-gray-700 my-1"></div>
                    <div className="md:hidden">
                      <Link to="/" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                        <i className="fas fa-home mr-2"></i>
                        Trang chủ
                      </Link>
                      <Link to="/search" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                        <i className="fas fa-search mr-2"></i>
                        Tìm kiếm
                      </Link>
                      <Link to="/profile/reading-history" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                        <i className="fas fa-history mr-2"></i>
                        Lịch sử
                      </Link>
                      <Link to="/genres" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                        <i className="fas fa-tags mr-2"></i>
                        Thể loại
                      </Link>
                      <Link to="/rankings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                        <i className="fas fa-trophy mr-2"></i>
                        Xếp hạng
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {isSearchOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-200"
            onClick={() => setIsSearchOpen(false)}
          ></div>
          <div
            className="fixed top-0 left-0 w-full bg-gray-900 p-4 shadow-lg z-50 transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchKeyword}
                onChange={handleSearchInputChange}
                placeholder="Tìm kiếm truyện..."
                className="w-full bg-gray-800 text-white rounded-full py-3 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1"
              >
                <i className="fas fa-search"></i>
              </button>
            </form>
          </div>
        </>
      )}

      {/* Spacer to prevent content from being hidden under the fixed header */}
      <div className="h-16"></div>
    </>
  );
};

export default NewHeader;
