import React from 'react';
import ProfileLayout from '../components/layouts/ProfileLayout';
import useFavoriteList from '../hooks/useFavoriteList';
import FavoriteMangaCard from '../components/FavoriteMangaCard';
import Pagination from '../components/Pagination';

const FavoriteList: React.FC = () => {
    const {
        // Data
        favorites,

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

        // Actions
        handleRemoveFavorite,

        // Utils
        formatCount
    } = useFavoriteList(18);

    // Hiển thị error nếu có
    if (error) {
        return (
            <ProfileLayout>
                <div className="grid grid-cols-1 gap-[30px]">
                    <div>
                        <h5 className="text-xl font-semibold">Danh sách truyện yêu thích:</h5>
                        <div className="mt-6 rounded-md bg-white p-6 shadow text-center">
                            <p className="text-red-500 mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                            >
                                Thử lại
                            </button>
                        </div>
                    </div>
                </div>
            </ProfileLayout>
        );
    }

    if (loading) {
        return (
            <ProfileLayout>
                <div className="grid grid-cols-1 gap-[30px]">
                    <div>
                        <h5 className="text-xl font-semibold">Danh sách truyện yêu thích:</h5>
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    </div>
                </div>
            </ProfileLayout>
        );
    }

  return (
    <ProfileLayout>
      <div className="grid grid-cols-1 gap-[30px]">
        <div>
          <h5 className="text-xl font-semibold">Danh sách truyện yêu thích:</h5>

                    {isEmpty ? (
                        <div className="mt-6 rounded-md bg-white p-6 shadow text-center">
                            <p className="text-gray-600">Bạn chưa có truyện yêu thích nào.</p>
                            <a href="/" className="mt-4 inline-block rounded-md border border-purple-600 bg-purple-600 px-5 py-2 text-center align-middle text-base font-semibold tracking-wide text-white duration-500 hover:border-purple-700 hover:bg-purple-700">
                                Khám phá truyện
                            </a>
                        </div>
                    ) : hasData ? (
                        <>
                            {/* Thông tin trang */}
                            <div className="mt-4 text-gray-600">
                                Tìm thấy {totalElements} truyện yêu thích
                            </div>

                            {/* Grid hiển thị manga */}
                            <div className="grid grid-cols-2 gap-[15px] md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mt-6">
                                {favorites.map((favorite) => (
                                    <FavoriteMangaCard
                                        key={favorite.mangaId}
                                        favorite={favorite}
                                        formatCount={formatCount}
                                        onRemove={handleRemoveFavorite}
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
      </div>
    </ProfileLayout>
  );
};

export default FavoriteList;
