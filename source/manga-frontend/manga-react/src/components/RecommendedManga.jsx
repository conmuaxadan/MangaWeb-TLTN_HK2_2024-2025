import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import useRecommendedManga from '../hooks/useRecommendedManga.js';
import MangaCard from './MangaCard.jsx';

const RecommendedManga = () => {
    const {
        recommendedManga,
        loading,
        error,
        formatCount
    } = useRecommendedManga(10);

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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!recommendedManga || recommendedManga.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Không có truyện đề cử nào</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <h2 className="flex items-center gap-3 text-xl font-semibold text-gray-900 border-l-4 border-purple-600 pl-3 mb-4">
                <FontAwesomeIcon icon={faStar} className="text-purple-500 text-2xl" />
                Truyện mới đăng
            </h2>
            <div className="mb-5">
                <Swiper
                    className="pb-2"
                    modules={[Navigation, Pagination]}
                    spaceBetween={15}
                    slidesPerView={2}
                    navigation={true}
                    pagination={false} /* Ẩn các chấm phân trang */
                    loop={true}
                    breakpoints={{
                        // Màn hình nhỏ
                        480: {
                            slidesPerView: 3,
                            spaceBetween: 15,
                        },
                        // Màn hình trung bình
                        768: {
                            slidesPerView: 4,
                            spaceBetween: 15,
                        },
                        // Màn hình lớn
                        1024: {
                            slidesPerView: 6,
                            spaceBetween: 15,
                        },
                    }}
                >
                    {recommendedManga.map((manga) => (
                        <SwiperSlide key={manga.id}>
                            <MangaCard
                                manga={manga}
                                formatCount={formatCount}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default RecommendedManga;
