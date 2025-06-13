import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faRedo,
    faChevronDown,
    faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { MangaStatus, MangaStatusDisplayNames } from '../interfaces/manga.js';

const SearchForm = ({
    filters,
    updateFilters,
    genres,
    loadingGenres,
    showFilters,
    setShowFilters,
    showGenres,
    setShowGenres,
    onSubmit,
    onReset,
    onGenreToggle
}) => {
    return (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Bộ lọc tìm kiếm</h2>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-gray-500 hover:text-gray-900 transition-colors"
                    aria-label={showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
                >
                    <FontAwesomeIcon icon={showFilters ? faChevronUp : faChevronDown} />
                </button>
            </div>

            {showFilters && (
                <form onSubmit={onSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        {/* Tên truyện */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-600 mb-1">
                                Tên truyện
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={filters.title}
                                onChange={(e) => updateFilters({ title: e.target.value })}
                                placeholder="Nhập tên truyện..."
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {/* Tác giả */}
                        <div>
                            <label htmlFor="author" className="block text-sm font-medium text-gray-600 mb-1">
                                Tác giả
                            </label>
                            <input
                                type="text"
                                id="author"
                                value={filters.author}
                                onChange={(e) => updateFilters({ author: e.target.value })}
                                placeholder="Nhập tên tác giả..."
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {/* Tình trạng */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-600 mb-1">
                                Tình trạng
                            </label>
                            <select
                                id="status"
                                value={filters.status}
                                onChange={(e) => updateFilters({ status: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Tất cả</option>
                                {Object.entries(MangaStatusDisplayNames).map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Năm phát hành */}
                        <div>
                            <label htmlFor="year" className="block text-sm font-medium text-gray-600 mb-1">
                                Năm phát hành
                            </label>
                            <select
                                id="year"
                                value={filters.yearOfRelease}
                                onChange={(e) => updateFilters({ yearOfRelease: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Tất cả</option>
                                {Array.from(
                                    { length: new Date().getFullYear() - 1980 + 1 },
                                    (_, i) => new Date().getFullYear() - i
                                ).map((year) => (
                                    <option key={year} value={year.toString()}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sắp xếp theo */}
                        <div>
                            <label htmlFor="orderBy" className="block text-sm font-medium text-gray-600 mb-1">
                                Sắp xếp theo
                            </label>
                            <select
                                id="orderBy"
                                value={filters.orderBy}
                                onChange={(e) => updateFilters({ orderBy: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="lastChapterAddedAt,desc">Mới cập nhật</option>
                                <option value="lastChapterAddedAt,asc">Cũ nhất</option>
                                <option value="views,desc">Lượt xem nhiều nhất</option>
                                <option value="loves,desc">Lượt thích nhiều nhất</option>
                                <option value="yearOfRelease,desc">Năm phát hành (mới nhất)</option>
                                <option value="yearOfRelease,asc">Năm phát hành (cũ nhất)</option>
                            </select>
                        </div>
                    </div>

                    {/* Thể loại */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-600">
                                Thể loại {filters.selectedGenres.length > 0 && `(${filters.selectedGenres.length} đã chọn)`}
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowGenres(!showGenres)}
                                className="text-gray-500 hover:text-gray-900 transition-colors"
                                aria-label={showGenres ? "Ẩn thể loại" : "Hiện thể loại"}
                            >
                                <FontAwesomeIcon icon={showGenres ? faChevronUp : faChevronDown} />
                            </button>
                        </div>

                        {showGenres && (
                            loadingGenres ? (
                                <div className="flex justify-center items-center h-20">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                    {genres.map((genre) => (
                                        <div
                                            key={genre.name}
                                            className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                                                filters.selectedGenres.includes(genre.name)
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                            onClick={() => onGenreToggle(genre.name)}
                                        >
                                            {genre.name}
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>

                    {/* Nút tìm kiếm và reset */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center justify-center transition-colors"
                        >
                            <FontAwesomeIcon icon={faSearch} className="mr-2" />
                            Tìm kiếm
                        </button>
                        <button
                            type="button"
                            onClick={onReset}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md flex items-center justify-center transition-colors"
                        >
                            <FontAwesomeIcon icon={faRedo} className="mr-2" />
                            Đặt lại
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default SearchForm;
