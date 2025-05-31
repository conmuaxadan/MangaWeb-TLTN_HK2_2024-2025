import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faTags, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import useGenreDetail from '../hooks/useGenreDetail.js';
import { useGenres } from '../hooks/useGenres.js';
import MangaCard from '../components/MangaCard.jsx';
import Pagination from '../components/Pagination.jsx';


const GenreDetail = () => {
    const {
        // Data
        mangaList,
        genreName,
        genreInfo,

        // Pagination
        currentPage,
        totalPages,
        totalElements,
        pageSize,
        handlePageChange,

        // States
        loading,
        error,
        hasData,
        isEmpty,

        // Utils
        formatCount
    } = useGenreDetail(18);

    // Hook để lấy danh sách tất cả thể loại
    const { genres: allGenres, loading: genresLoading } = useGenres();

    // State để quản lý việc hiển thị dropdown thể loại
    const [showGenreDropdown, setShowGenreDropdown] = useState(false);
    const genreDropdownRef = useRef(null);

    // Hiển thị error nếu có
    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <ul className="mb-6 inline-flex items-center gap-4">
        <li>
          <Link className="text-blue-500 transition hover:text-blue-700" to="/">
            <span>Trang chủ</span>
          </Link>
        </li>
        <li className="text-gray-500">/</li>
        <li>
          <span className="text-black">Thể loại: {genreName}</span>
        </li>
      </ul>

      <div className="relative mb-5 flex items-center justify-between">
        <div className="relative" ref={genreDropdownRef}>
          <h1
            className="flex items-center gap-3 text-xl font-semibold text-gray-900 border-l-4 border-purple-600 pl-3 cursor-pointer hover:text-purple-700 transition-colors"
            onMouseEnter={() => setShowGenreDropdown(true)}
            onMouseLeave={() => setShowGenreDropdown(false)}
          >
            <FontAwesomeIcon icon={faTag} className="text-purple-500 text-2xl" />
            <span>Truyện thể loại: {genreName}</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-sm text-gray-500 ml-1" />
          </h1>

          {/* Dropdown thể loại */}
          {showGenreDropdown && !genresLoading && allGenres && allGenres.length > 0 && (
            <div
              className="absolute left-0 top-full pt-2 w-[600px] z-[60]"
              onMouseEnter={() => setShowGenreDropdown(true)}
              onMouseLeave={() => setShowGenreDropdown(false)}
            >
              {/* Invisible bridge để không bị tắt khi di chuột */}
              <div className="h-2 w-full"></div>

              <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
                <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto">
                  {allGenres.map((genre) => (
                    <Link
                      key={genre.name}
                      to={`/genre/${genre.name}`}
                      className={`text-sm px-2 py-1 rounded transition-colors ${
                        genre.name === genreName
                          ? 'bg-purple-100 text-purple-700 font-medium'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mô tả thể loại */}
      {genreInfo?.description && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-700 leading-relaxed">{genreInfo.description}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : isEmpty ? (
        <div className="text-center py-20 text-gray-500">
          Không tìm thấy truyện nào thuộc thể loại này
        </div>
      ) : hasData ? (
        <>
          <div className="mb-4 text-gray-600">
            Tìm thấy {totalElements} kết quả
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mangaList.map((manga) => (
              <MangaCard
                key={manga.id}
                manga={manga}
                formatCount={formatCount}
              />
            ))}
          </div>

          {/* Phân trang */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </>
      ) : null}
    </div>
  );
};

export default GenreDetail;
