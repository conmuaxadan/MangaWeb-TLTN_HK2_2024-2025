import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '@fortawesome/fontawesome-free/css/all.min.css';
import mangaService from '../services/manga-service';
import { MangaResponse, GenreResponse } from '../interfaces/models/manga';
import { getMangaImageUrl } from '../utils/file-utils';

const NewHeader = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchResults, setSearchResults] = useState<MangaResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showGenresMobile, setShowGenresMobile] = useState(false);
  const [genres, setGenres] = useState<GenreResponse[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isLogin, logout, user } = useAuth();
  const navigate = useNavigate();

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

      // Đóng dropdown kết quả tìm kiếm khi click bên ngoài
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lấy danh sách thể loại
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const genresData = await mangaService.getAllGenres();
        if (genresData) {
          setGenres(genresData);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách thể loại:', error);
      }
    };

    fetchGenres();
  }, []);

  // Focus vào input khi mở search
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

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

  // Debounce function để tránh gọi API quá nhiều khi người dùng gõ
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return function(...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Hàm tìm kiếm manga
  const searchManga = useCallback(async (keyword: string) => {
    if (keyword.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await mangaService.searchManga(keyword, 0, 5);
      if (results && results.content.length > 0) {
        setSearchResults(results.content);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error searching manga:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(debounce(searchManga, 300), [searchManga]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchKeyword(value);
    debouncedSearch(value);
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await logout();
    } catch (error) {
      console.error('Header: Lỗi khi logout:', error);
    }
    setIsMenuOpen(false);
    scrollToTop();
  };

  // Hàm xử lý cuộn lên đầu trang
  const scrollToTop = () => {
    // Cuộn lên đầu trang ngay lập tức
    window.scrollTo(0, 0);
  };

  return (
    <>
      {/* Header */}
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <span className="text-gray-900 font-bold text-xl tracking-tight">R-Manga</span>
              </Link>
            </div>

            {/* Search Bar in Header */}
            <div className="hidden md:flex flex-1 max-w-xl mx-auto relative">
              <div className="w-full relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchKeyword}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchKeyword.trim().length >= 2 && setShowResults(true)}
                  placeholder="Tìm kiếm truyện..."
                  className="w-full bg-gray-100 text-gray-900 rounded-full py-2 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
                />
                <button
                  onClick={handleSearchSubmit}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-900 p-1"
                >
                  <i className="fas fa-search"></i>
                </button>

                {/* Search Results Dropdown */}
                {showResults && searchKeyword.trim().length >= 2 && (
                  <div
                    ref={searchResultsRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg overflow-hidden z-50"
                  >
                    {isSearching ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                        Đang tìm kiếm...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div>
                        {searchResults.map((manga) => (
                          <Link
                            key={manga.id}
                            to={`/mangas/${manga.id}`}
                            className="flex items-center p-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                            onClick={() => {
                              setShowResults(false);
                              scrollToTop();
                            }}
                          >
                            <div className="flex-shrink-0 h-12 w-9 bg-gray-200 rounded overflow-hidden mr-3">
                              <img
                                src={getMangaImageUrl(manga.coverUrl) || '/images/default-manga-cover.jpg'}
                                alt={manga.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{manga.title}</p>
                              <p className="text-xs text-gray-500 truncate">{manga.author}</p>
                            </div>
                          </Link>
                        ))}
                        <div className="p-2 text-center border-t border-gray-200">
                          <Link
                            to={`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`}
                            className="text-xs text-purple-400 hover:text-purple-300"
                            onClick={() => {
                              setShowResults(false);
                              scrollToTop();
                            }}
                          >
                            Xem tất cả kết quả
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Không tìm thấy kết quả
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              {/* Username display when logged in */}
              {isLogin && user && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                  <i className="fas fa-user"></i>
                  <span className="text-sm font-medium truncate max-w-[120px]">{user.displayName}</span>
                </div>
              )}

              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={handleMenuClick}
                  className="w-10 h-10 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors flex items-center justify-center"
                  aria-label="User menu"
                >
                  <i className="fas fa-bars"></i>
                </button>

                {/* Dropdown menu */}
                {isMenuOpen && (
                  <>
                    {/* Mobile menu - full width */}
                    <div className="md:hidden fixed left-0 top-16 w-full bg-white text-gray-800 shadow-lg z-50 transition-all duration-200">
                      {!isLogin ? (
                        <>
                          {/* Mobile search bar */}
                          <div className="px-4 py-3 border-b border-gray-200">
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              if (searchKeyword.trim()) {
                                navigate(`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`);
                                setIsMenuOpen(false);
                              }
                            }} className="relative">
                              <input
                                type="text"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                placeholder="Tìm kiếm truyện..."
                                className="w-full bg-gray-100 text-gray-800 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
                              />
                              <button
                                type="submit"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                <i className="fas fa-search"></i>
                              </button>
                            </form>
                          </div>

                          {/* Mobile navigation links for non-logged in users */}
                          <div>
                            <Link to="/search" onClick={() => setIsMenuOpen(false)} className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors">
                              <i className="fas fa-search mr-2"></i>
                              Tìm kiếm nâng cao
                            </Link>
                            <button
                              onClick={() => setShowGenresMobile(!showGenresMobile)}
                              className="block w-full text-left px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors"
                            >
                              <i className="fas fa-tags mr-2"></i>
                              Thể loại
                              <i className={`fas fa-chevron-${showGenresMobile ? 'up' : 'down'} ml-2 float-right mt-1`}></i>
                            </button>
                            {showGenresMobile && (
                              <div className="bg-gray-50 py-2 border-b border-gray-200">
                                <div className="grid grid-cols-2 gap-1">
                                  {genres.map((genre) => (
                                    <Link
                                      key={genre.name}
                                      to={`/genre/${genre.name}`}
                                      className="block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors truncate"
                                      onClick={() => setIsMenuOpen(false)}
                                    >
                                      {genre.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="border-t border-gray-200">
                            <Link to="/login" onClick={() => {
                              setIsMenuOpen(false);
                              scrollToTop();
                            }} className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors">
                              <i className="fas fa-sign-in-alt mr-2"></i>
                              Đăng nhập
                            </Link>
                            <Link to="/register" onClick={() => {
                              setIsMenuOpen(false);
                              scrollToTop();
                            }} className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors">
                              <i className="fas fa-user-plus mr-2"></i>
                              Đăng ký
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Mobile search bar */}
                          <div className="px-4 py-3 border-b border-gray-200">
                            <div className="relative">
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                if (searchKeyword.trim()) {
                                  navigate(`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`);
                                  setIsMenuOpen(false);
                                  scrollToTop();
                                }
                              }} className="relative">
                                <input
                                  type="text"
                                  value={searchKeyword}
                                  onChange={(e) => {
                                    setSearchKeyword(e.target.value);
                                    debouncedSearch(e.target.value);
                                  }}
                                  onFocus={() => searchKeyword.trim().length >= 2 && setShowResults(true)}
                                  placeholder="Tìm kiếm truyện..."
                                  className="w-full bg-gray-100 text-gray-800 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
                                />
                                <button
                                  type="submit"
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                  <i className="fas fa-search"></i>
                                </button>
                              </form>

                              {/* Mobile search results dropdown */}
                              {showResults && searchKeyword.trim().length >= 2 && (
                                <div className="absolute left-0 right-0 mt-1 bg-white rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                                  {isSearching ? (
                                    <div className="p-4 text-center text-gray-500">
                                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                                      Đang tìm kiếm...
                                    </div>
                                  ) : searchResults.length > 0 ? (
                                    <div>
                                      {searchResults.map((manga) => (
                                        <Link
                                          key={manga.id}
                                          to={`/mangas/${manga.id}`}
                                          className="flex items-center p-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                                          onClick={() => {
                                            setShowResults(false);
                                            setIsMenuOpen(false);
                                            scrollToTop();
                                          }}
                                        >
                                          <div className="flex-shrink-0 h-12 w-9 bg-gray-200 rounded overflow-hidden mr-3">
                                            <img
                                              src={getMangaImageUrl(manga.coverUrl) || '/images/default-manga-cover.jpg'}
                                              alt={manga.title}
                                              className="h-full w-full object-cover"
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{manga.title}</p>
                                            <p className="text-xs text-gray-500 truncate">{manga.author}</p>
                                          </div>
                                        </Link>
                                      ))}
                                      <div className="p-2 text-center border-t border-gray-200">
                                        <Link
                                          to={`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`}
                                          className="text-xs text-purple-400 hover:text-purple-300"
                                          onClick={() => {
                                            setShowResults(false);
                                            setIsMenuOpen(false);
                                            scrollToTop();
                                          }}
                                        >
                                          Xem tất cả kết quả
                                        </Link>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-4 text-center text-gray-500">
                                      Không tìm thấy kết quả
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Mobile navigation links */}
                          <div>
                            <Link to="/search" onClick={() => setIsMenuOpen(false)} className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors">
                              <i className="fas fa-search mr-2"></i>
                              Tìm kiếm nâng cao
                            </Link>
                            <button
                              onClick={() => setShowGenresMobile(!showGenresMobile)}
                              className="block w-full text-left px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors"
                            >
                              <i className="fas fa-tags mr-2"></i>
                              Thể loại
                              <i className={`fas fa-chevron-${showGenresMobile ? 'up' : 'down'} ml-2 float-right mt-1`}></i>
                            </button>
                            {showGenresMobile && (
                              <div className="bg-gray-50 py-2 border-b border-gray-200">
                                <div className="grid grid-cols-2 gap-1">
                                  {genres.map((genre) => (
                                    <Link
                                      key={genre.name}
                                      to={`/genre/${genre.name}`}
                                      className="block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors truncate"
                                      onClick={() => setIsMenuOpen(false)}
                                    >
                                      {genre.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                            <Link to="/profile/reading-history" onClick={() => {
                              scrollToTop();
                              setIsMenuOpen(false);
                            }} className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors">
                              <i className="fas fa-history mr-2"></i>
                              Lịch sử đọc
                            </Link>
                            <Link to="/profile/favorites" onClick={() => {
                              scrollToTop();
                              setIsMenuOpen(false);
                            }} className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors">
                              <i className="fas fa-heart mr-2"></i>
                              Yêu thích
                            </Link>
                          </div>
                          <div className="border-t border-gray-200">
                            <Link to="/profile" onClick={() => {
                              scrollToTop();
                              setIsMenuOpen(false);
                            }} className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors">
                              <i className="fas fa-user mr-2"></i>
                              Trang cá nhân
                            </Link>
                            <Link to="/profile/settings" onClick={() => {
                              scrollToTop();
                              setIsMenuOpen(false);
                            }} className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors">
                              <i className="fas fa-cog mr-2"></i>
                              Cài đặt
                            </Link>
                            <a href="#" onClick={handleLogout} className="block px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-200 transition-colors">
                              <i className="fas fa-sign-out-alt mr-2"></i>
                              Đăng xuất
                            </a>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Desktop menu - dropdown style */}
                    <div className="hidden md:block absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50 transition-all duration-200">
                    {!isLogin ? (
                      <>
                        <Link to="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                          <i className="fas fa-sign-in-alt mr-2"></i>
                          Đăng nhập
                        </Link>
                        <Link to="/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                          <i className="fas fa-user-plus mr-2"></i>
                          Đăng ký
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link to="/profile" onClick={scrollToTop} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                          <i className="fas fa-user mr-2"></i>
                          Trang cá nhân
                        </Link>
                        <Link to="/profile/favorites" onClick={scrollToTop} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                          <i className="fas fa-heart mr-2"></i>
                          Truyện yêu thích
                        </Link>
                        <Link to="/profile/reading-history" onClick={scrollToTop} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                          <i className="fas fa-history mr-2"></i>
                          Lịch sử đọc
                        </Link>
                        <Link to="/profile/settings" onClick={scrollToTop} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                          <i className="fas fa-cog mr-2"></i>
                          Cài đặt
                        </Link>
                        <div className="border-t border-gray-200 my-1"></div>

                        <a href="#" onClick={handleLogout} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                          <i className="fas fa-sign-out-alt mr-2"></i>
                          Đăng xuất
                        </a>
                      </>
                    )}

                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search overlay for mobile */}
      {isSearchOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-200"
            onClick={() => setIsSearchOpen(false)}
          ></div>
          <div
            className="fixed top-0 left-0 w-full bg-white p-4 shadow-lg z-50 transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchKeyword}
                onChange={handleSearchInputChange}
                placeholder="Tìm kiếm truyện..."
                className="w-full bg-gray-100 text-gray-900 rounded-full py-3 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-900 p-1"
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
