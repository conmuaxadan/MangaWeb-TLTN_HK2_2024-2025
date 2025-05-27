import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import useLatestUpdates from '../hooks/useLatestUpdates.js';
import MangaCard from './MangaCard.jsx';
import Pagination from './Pagination.jsx';

const LatestUpdates = () => {
    const {
        mangaList,
        currentPage,
        totalPages,
        totalElements,
        pageSize,
        handlePageChange,
        loading,
        error,
        formatCount
    } = useLatestUpdates(20);

    // Hiển thị error nếu có
    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="relative mb-5 flex items-center justify-between">
                <h1 className="flex items-center gap-3 text-xl font-semibold text-gray-900 border-l-4 border-purple-600 pl-3">
                    <FontAwesomeIcon icon={faClock} className="text-purple-500 text-2xl" />
                    <span>Truyện mới cập nhật</span>
                </h1>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            ) : mangaList.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">Không có truyện mới cập nhật nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                    {mangaList.map((manga) => (
                        <MangaCard
                            key={manga.id}
                            manga={manga}
                            formatCount={formatCount}
                        />
                    ))}
                </div>
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

export default LatestUpdates;
