import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import mangaService from '../services/manga-service.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faSearch, faTags, faChevronUp, faChevronDown, faHistory, faHeart } from '@fortawesome/free-solid-svg-icons';

const NavigationToolbar = () => {
  const [genres, setGenres] = useState([]);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const genreDropdownRef = useRef(null);

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
    const handleClickOutside = (event) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target)) {
        setShowGenreDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <div className="hidden md:block bg-white rounded-lg shadow-md mb-6 border border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-6">
          <Link
            to="/"
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <FontAwesomeIcon icon={faHome} className="mr-2" />
            Trang chủ
          </Link>
          <Link
            to="/search"
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <FontAwesomeIcon icon={faSearch} className="mr-2" />
            Tìm kiếm nâng cao
          </Link>
          <div className="relative" ref={genreDropdownRef}>
            <button
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              onMouseEnter={() => setShowGenreDropdown(true)}
              onClick={() => setShowGenreDropdown(!showGenreDropdown)}
            >
              <FontAwesomeIcon icon={faTags} className="mr-2" />
              Thể loại
              <FontAwesomeIcon
                icon={showGenreDropdown ? faChevronUp : faChevronDown}
                className="ml-2"
              />
            </button>

            {/* Dropdown menu */}
            {showGenreDropdown && (
              <div
                className="absolute left-0 top-full mt-2 w-[600px] bg-white rounded-lg shadow-lg z-[60] p-3"
                onMouseLeave={() => setShowGenreDropdown(false)}
              >
                <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto">
                  {genres.map((genre) => (
                    <Link
                      key={genre.name}
                      to={`/genre/${genre.name}`}
                      className="text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                      onClick={() => setShowGenreDropdown(false)}
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to="/profile/reading-history"
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <FontAwesomeIcon icon={faHistory} className="mr-2" />
            Lịch sử
          </Link>
          <Link
            to="/profile/favorites"
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <FontAwesomeIcon icon={faHeart} className="mr-2" />
            Yêu thích
          </Link>

        </div>
      </div>
    </div>
  );
};

export default NavigationToolbar;
