import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag } from '@fortawesome/free-solid-svg-icons';
import useGenreDetail from '../hooks/useGenreDetail';
import GenreMangaCard from '../components/GenreMangaCard';
import Pagination from '../components/Pagination';


const GenreDetail: React.FC = () => {
    const {
        // Data
        mangaList,
        genreName,

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
        <h1 className="flex items-center gap-3 text-xl font-semibold text-gray-900 border-l-4 border-purple-600 pl-3">
          <FontAwesomeIcon icon={faTag} className="text-purple-500 text-2xl" />
          <span>Truyện thể loại: {genreName}</span>
        </h1>
      </div>

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
              <GenreMangaCard
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
