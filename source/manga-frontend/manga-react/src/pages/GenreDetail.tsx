import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useMangasByGenre } from '../hooks/queries/useMangaQueries';
import { MangaResponse } from '../interfaces/models/manga';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getMangaImageUrl } from '../utils/file-utils';



const GenreDetail: React.FC = () => {
  const { genreName } = useParams<{ genreName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();


  // Lấy trang hiện tại từ URL, mặc định là 0 (trang đầu tiên)
  const currentPage = parseInt(searchParams.get('page') || '0');
  const pageSize = 20; // Số truyện mỗi trang

  // Sử dụng hook để lấy danh sách manga theo thể loại
  const { data, isLoading, isError, error } = useMangasByGenre(
    genreName || '',
    currentPage,
    pageSize
  );



  // Xử lý chuyển trang
  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
    // Cuộn lên đầu trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render phân trang
  const renderPagination = () => {
    if (!data || !data.totalPages || data.totalPages <= 1) return null;

    const totalPages = data.totalPages;
    const currentPageNumber = data.number;

    // Tạo mảng các trang hiển thị (tối đa 5 trang)
    let pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(0, currentPageNumber - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    console.log('Pagination data:', { totalPages, currentPageNumber, pages });

    return (
      <div className="flex justify-center mt-8">
        <ul className="flex space-x-2">
          {/* Nút trang trước */}
          <li className={`text-center ${currentPageNumber === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <button
              onClick={() => currentPageNumber > 0 && handlePageChange(currentPageNumber - 1)}
              disabled={currentPageNumber === 0}
              className="px-3 py-2 rounded border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
              aria-label="Previous page"
            >
              &lt;
            </button>
          </li>

          {/* Các trang */}
          {pages.map((page) => (
            <li key={page} className="text-center">
              <button
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 rounded border ${
                  page === currentPageNumber
                    ? 'bg-purple-600 text-white border-purple-700'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {page + 1}
              </button>
            </li>
          ))}

          {/* Nút trang sau */}
          <li className={`text-center ${currentPageNumber === totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <button
              onClick={() => currentPageNumber < totalPages - 1 && handlePageChange(currentPageNumber + 1)}
              disabled={currentPageNumber === totalPages - 1}
              className="px-3 py-2 rounded border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
              aria-label="Next page"
            >
              &gt;
            </button>
          </li>
        </ul>
      </div>
    );
  };

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
          <Link className="text-blue-500 transition hover:text-blue-700" to="/genres">
            <span>Thể loại</span>
          </Link>
        </li>
        <li className="text-gray-500">/</li>
        <li>
          <span className="text-gray-400">{genreName}</span>
        </li>
      </ul>

      <div className="relative mb-5 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-xl font-semibold text-white border-l-4 border-purple-600 pl-3">
          <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" className="text-purple-500 text-2xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M64 480H48c-8.8 0-16-7.2-16-16V208c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v256c0 8.8-7.2 16-16 16zm64-160H112c-8.8 0-16-7.2-16-16V208c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v96c0 8.8-7.2 16-16 16zm64 0h-16c-8.8 0-16-7.2-16-16V208c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v96c0 8.8-7.2 16-16 16zm64 160h-16c-8.8 0-16-7.2-16-16V208c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v256c0 8.8-7.2 16-16 16zm64-32h-16c-8.8 0-16-7.2-16-16V208c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v224c0 8.8-7.2 16-16 16zm64-128h-16c-8.8 0-16-7.2-16-16V208c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v96c0 8.8-7.2 16-16 16zm64-32h-16c-8.8 0-16-7.2-16-16V208c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16zm64 32h-16c-8.8 0-16-7.2-16-16V208c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v96c0 8.8-7.2 16-16 16z"></path>
          </svg>
          <span>Truyện thể loại: {genreName}</span>
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : isError ? (
        <div className="text-red-500 text-center py-8">{(error as Error)?.message || 'Đã xảy ra lỗi khi tải danh sách truyện'}</div>
      ) : data && data.content.length > 0 ? (
        <>
          <div className="mb-4 text-gray-400">
            Tìm thấy {data.totalElements} kết quả
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.content.map((manga) => (
              <div key={manga.id} className="group bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                <figure className="clearfix">
                  <div className="relative mb-2">
                    <a title={manga.title} href={`/mangas/${manga.id}`} className="block">
                      <div className="relative pb-[150%]">
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                          <div className="relative h-full w-full">
                            <div className="absolute bottom-0 left-0 z-[1] h-3/5 w-full bg-gradient-to-t from-gray-900 from-[15%] to-transparent transition-all duration-500 group-hover:h-3/4"></div>
                            <img
                              src={getMangaImageUrl(manga.coverUrl)}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[102%]"
                              alt={manga.title}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/default-manga-cover.jpg';
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 z-[2] w-full px-3 py-2">
                        <h3 className="mb-2 line-clamp-2 text-xs font-semibold leading-tight text-white transition group-hover:line-clamp-3">
                          {manga.title}
                        </h3>
                        <span className="flex items-center justify-between gap-1 text-[10px] text-gray-300">
                          <span className="flex items-center gap-1">
                            <i className="fa fa-eye text-yellow-500"></i>{manga.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="fa fa-comment text-blue-400"></i>{manga.comments || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="fa fa-heart text-red-500"></i>{manga.loves || 0}
                          </span>
                        </span>
                      </div>
                    </a>
                  </div>
                  <figcaption className="px-3 pb-3">
                    <ul className="flex flex-col gap-1">
                      <li className="flex items-center justify-between gap-x-2 text-[10px]">
                        {manga.chapters && manga.chapters.length > 0 ? (
                          <a
                            title={`Chapter ${manga.chapters.length}`}
                            className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition visited:text-gray-400 hover:text-purple-400 text-gray-200 text-[10px]"
                            href={`/mangas/${manga.id}/chapters/${manga.chapters[manga.chapters.length - 1]}`}
                          >
                            Chapter {manga.chapters.length}
                          </a>
                        ) : (
                          <span className="text-gray-400 text-[10px]">Chưa có chapter</span>
                        )}
                        {manga.lastChapterAddedAt && (
                          <span className="text-gray-400 text-[10px]">
                            {formatDistanceToNow(new Date(manga.lastChapterAddedAt), { addSuffix: true, locale: vi })}
                          </span>
                        )}
                      </li>
                    </ul>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
          <div className="mt-8">
            {renderPagination()}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-400">
          Không tìm thấy truyện nào thuộc thể loại này
        </div>
      )}
    </div>
  );
};

export default GenreDetail;
