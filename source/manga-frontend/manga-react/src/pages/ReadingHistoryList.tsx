import React from 'react';
import ProfileLayout from '../components/layouts/ProfileLayout';
import useReadingHistory from '../hooks/useReadingHistory';
import ReadingHistoryCard from '../components/ReadingHistoryCard';
import Pagination from '../components/Pagination';

const ReadingHistoryList: React.FC = () => {
    const {
        // Data
        readingHistory,

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
        isEmpty
    } = useReadingHistory(18);

    // Hiển thị error nếu có
    if (error) {
        return (
            <ProfileLayout>
                <div className="grid grid-cols-1 gap-[30px]">
                    <div>
                        <h5 className="text-xl font-semibold">Lịch sử đọc truyện:</h5>
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
                        <h5 className="text-xl font-semibold">Lịch sử đọc truyện:</h5>
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
                    <h5 className="text-xl font-semibold">Lịch sử đọc truyện:</h5>

                    {isEmpty ? (
                        <div className="mt-6 rounded-md bg-white p-6 shadow text-center">
                            <p className="text-gray-600">Bạn chưa có lịch sử đọc nào.</p>
                            <a href="/" className="mt-4 inline-block rounded-md border border-purple-600 bg-purple-600 px-5 py-2 text-center align-middle text-base font-semibold tracking-wide text-white duration-500 hover:border-purple-700 hover:bg-purple-700">
                                Khám phá truyện
                            </a>
                        </div>
                    ) : hasData ? (
                        <>
                            {/* Thông tin trang */}
                            <div className="mt-4 text-gray-600">
                                Tìm thấy {totalElements} lịch sử đọc
                            </div>

                            {/* Grid hiển thị lịch sử */}
                            <div className="grid grid-cols-2 gap-[15px] md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mt-6">
                                {readingHistory.map((history) => (
                                    <ReadingHistoryCard
                                        key={history.id}
                                        history={history}
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

export default ReadingHistoryList;
