import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import mangaService from '../services/manga-service';
import { GenreResponse } from '../interfaces/models/manga';

const NavigationToolbar: React.FC = () => {
  const [genres, setGenres] = useState<GenreResponse[]>([]);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const genreDropdownRef = useRef<HTMLDivElement>(null);

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

  // Xử lý click bên ngoài dropdown để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setShowGenreDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <div className="hidden md:block bg-gray-800 rounded-lg shadow-md mb-6">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-6">
          <Link
            to="/"
            className="flex items-center text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <i className="fas fa-home mr-2"></i>
            Trang chủ
          </Link>
          <Link
            to="/search"
            className="flex items-center text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <i className="fas fa-search mr-2"></i>
            Tìm kiếm nâng cao
          </Link>
          <div className="relative" ref={genreDropdownRef}>
            <button
              className="flex items-center text-sm font-medium text-gray-300 hover:text-white transition-colors"
              onMouseEnter={() => setShowGenreDropdown(true)}
              onClick={() => setShowGenreDropdown(!showGenreDropdown)}
            >
              <i className="fas fa-tags mr-2"></i>
              Thể loại
              <i className={`fas fa-chevron-${showGenreDropdown ? 'up' : 'down'} ml-2`}></i>
            </button>

            {/* Dropdown menu */}
            {showGenreDropdown && (
              <div
                className="absolute left-0 top-full mt-2 w-80 bg-gray-800 rounded-lg shadow-lg z-50 p-3"
                onMouseLeave={() => setShowGenreDropdown(false)}
              >
                <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                  {genres.map((genre) => (
                    <Link
                      key={genre.name}
                      to={`/genre/${genre.name}`}
                      className="text-sm text-gray-300 hover:text-white hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                      onClick={() => setShowGenreDropdown(false)}
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>

              </div>
            )}
          </div>
          <Link
            to="/rankings"
            className="flex items-center text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <i className="fas fa-trophy mr-2"></i>
            Xếp hạng
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to="/profile/reading-history"
            className="flex items-center text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <i className="fas fa-history mr-2"></i>
            Lịch sử
          </Link>
          <Link
            to="/profile/favorites"
            className="flex items-center text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <i className="fas fa-heart mr-2"></i>
            Yêu thích
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NavigationToolbar;
