import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import useAdvancedSearch from '../hooks/useAdvancedSearch';
import SearchForm from '../components/SearchForm';
import SearchResultCard from '../components/SearchResultCard';
import Pagination from '../components/Pagination';

const AdvancedSearch: React.FC = () => {
    const {
        // Data
        searchResults,
        genres,

        // Filters
        filters,
        updateFilters,

        // UI State
        showFilters,
        setShowFilters,
        showGenres,
        setShowGenres,

        // Search State
        loading,
        error,
        totalPages,
        totalElements,
        currentPage,
        pageSize,
        loadingGenres,

        // Actions
        handleSubmit,
        handleReset,
        handleGenreToggle,
        handlePageChange,

        // Utils
        formatCount
    } = useAdvancedSearch(20);

    return (
        <div className="bg-gray-100 text-gray-900 min-h-screen">
            <div className="container mx-auto px-4 py-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-2">Tìm kiếm nâng cao</h1>
                    <p className="text-gray-600">
                        Tìm kiếm truyện theo nhiều tiêu chí khác nhau
                    </p>
                </div>

                {/* Form tìm kiếm */}
                <SearchForm
                    filters={filters}
                    updateFilters={updateFilters}
                    genres={genres}
                    loadingGenres={loadingGenres}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    showGenres={showGenres}
                    setShowGenres={setShowGenres}
                    onSubmit={handleSubmit}
                    onReset={handleReset}
                    onGenreToggle={handleGenreToggle}
                />

                {/* Kết quả tìm kiếm */}
                <div>
                    {/* Tiêu đề kết quả */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">
                            {totalElements > 0
                                ? `Kết quả tìm kiếm (${totalElements})`
                                : 'Kết quả tìm kiếm'}
                        </h2>
                        <div className="text-sm text-gray-600">
                            {totalElements > 0 && (
                                <>
                                    Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} / {totalElements}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Hiển thị kết quả */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/20 text-red-400 p-4 rounded-lg">
                            <p>{error}</p>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="bg-white p-8 rounded-lg text-center border border-gray-200">
                            <FontAwesomeIcon icon={faSearch} className="text-4xl text-gray-400 mb-4" />
                            <h3 className="text-xl font-medium mb-2 text-gray-900">Không tìm thấy kết quả</h3>
                            <p className="text-gray-500">
                                Không tìm thấy truyện nào phù hợp với tiêu chí tìm kiếm của bạn.
                                <br />
                                Hãy thử thay đổi các tiêu chí tìm kiếm và thử lại.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Grid hiển thị kết quả */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                                {searchResults.map((manga) => (
                                    <SearchResultCard
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdvancedSearch;
