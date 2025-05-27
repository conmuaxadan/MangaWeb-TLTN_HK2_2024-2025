import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import usePersonalRecommendations from '../hooks/usePersonalRecommendations.js';
import MangaCard from './MangaCard.jsx';

const PersonalRecommendations = () => {
    const {
        recommendedMangas,
        isLoading,
        error,
        showSection,
        isLogin,
        formatCount
    } = usePersonalRecommendations(6);

    // Hiển thị error nếu có
    if (error) {
        return (
            <div className="text-center py-4">
                <p className="text-red-500 text-sm">{error}</p>
            </div>
        );
    }

    // Đang tải, không đăng nhập, hoặc không có gợi ý - không hiển thị gì
    if (isLoading || !isLogin || !showSection) {
        return null;
    }

    return (
        <div className="flex flex-col gap-5">
            <h2 className="flex items-center gap-3 text-xl font-semibold text-gray-900 border-l-4 border-green-500 pl-3 mb-4">
                <FontAwesomeIcon icon={faUserCheck} className="text-green-500 text-2xl" />
                Có thể bạn muốn đọc
            </h2>
            <div className="mb-5">
                <Swiper
                    className="pb-2"
                    modules={[Navigation, Pagination]}
                    spaceBetween={15}
                    slidesPerView={2}
                    navigation={true}
                    pagination={false}
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
                    {recommendedMangas.map((manga) => (
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

export default PersonalRecommendations;