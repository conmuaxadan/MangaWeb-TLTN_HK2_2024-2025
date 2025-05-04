import { useEffect, useState } from 'react';
import { usePersonalRecommendations } from '../hooks/queries/useMangaQueries';
import { useAuth } from '../contexts/AuthContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { getMangaImageUrl } from '../utils/file-utils';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { MangaResponse } from '../interfaces/models/manga';
import { Link } from 'react-router-dom';

const PersonalRecommendations = () => {
    const { isLogin } = useAuth();
    const { data: recommendedMangas, isLoading } = usePersonalRecommendations(6);
    const [showSection, setShowSection] = useState(false);

    useEffect(() => {
        // Chỉ hiển thị section khi người dùng đã đăng nhập và có dữ liệu gợi ý
        setShowSection(isLogin && !!recommendedMangas && recommendedMangas.length > 0);
    }, [isLogin, recommendedMangas]);

    // Đang tải hoặc không đăng nhập hoặc không có gợi ý, không hiển thị gì cả
    if (isLoading || !showSection) {
        return null;
    }

    return (
        <div className="flex flex-col gap-5">
            <h2 className="flex items-center gap-3 text-xl font-semibold text-white border-l-4 border-green-500 pl-3 mb-4">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="text-green-500 text-2xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M505.12 234.76c-28.75-16.63-62.06-26.49-97.12-26.49-14.87 0-29.32 2.25-43.41 6.12V62.1a8.07 8.07 0 0 0-3.91-6.81c-2.13-1.2-5-1.5-7.85.29C329.52 65.65 280.3 107.5 240 153.36c-22.52-8.67-47.42-13.6-73.28-13.6-84.33 0-157.39 44.89-186.07 109.33-14.47 32.5-15.54 67.63-15.54 85.42C-35 379.35 65.48 480 181.72 480c77.68 0 134.57-42.54 157.17-122 17.63 12.13 36.3 20.58 57.71 20.58 38.48 0 79.58-22.22 100.64-50a93.93 93.93 0 0 0 15.45-49.18c1.81-20.92-1.39-38.14-7.57-44.64zM181.72 464c-102.24 0-192-87.84-192-175.35 0-21.54 3.37-89.65 83.93-89.65 36.42 0 73.28 15.72 93 26.25 31.71 17 51.43 34.12 59.87 48.16l.16.28c10.97 19.52 8.83 27.71 42.75 27.71 19.61 0 45.48-7.23 62.3-19.76-18.1 85.64-72.08 182.36-149.01 182.36zm227.28-136c-13.4 0-25.65-5.05-36.51-10.65-12.03-6.21-20.07-13.21-25.61-19.22-8.88-9.58-13.97-19.59-13.97-19.59l-26.21 26.2s5.96 8.21 15.89 18.62c9.94 10.41 19.78 17.58 19.78 17.58-14.18 6.3-29.72 9.61-47.06 9.61-34.43 0-67.91-7.93-97.53-22.33-32.36-15.78-60.85-38.13-83.39-64.75-24.25-28.58-40.03-62.8-40.03-99.76 0-38.2 16.14-74.04 42.74-102.53 30.71-32.9 71.61-51.9 111.11-56.27 21.13-2.35 42.11-1.01 62.3 3.64 31.31 7.23 59.74 22.67 81.62 44.71 25.56 25.73 38.8 53.16 38.8 80.8 0 19.22-4.84 34.8-14.51 46.47-7.34 8.87-17.16 15.12-28.43 17.3-13.8 2.67-28.75.05-40.22-7.05-6.93-4.27-11.94-9.68-15.15-16.37-2.94-6.19-3.37-12.3-1.91-18.75 1.46-6.45 4.88-12.93 10.31-19.95 8.49-10.96 19.2-20.16 23.09-23.47 4.63-3.94 7.38-9.75 7.38-15.96 0-5.77-2.33-11.27-6.45-15.27-2.1-2.04-4.54-3.61-7.15-4.67-11.39-4.63-28.9-5.09-42.97.5-10.86 4.3-23.01 15.38-23.01 15.38s-20.02 18.31-28.32 31.23c-8.29 12.92-13.9 29.31-13.9 48.14 0 18.83 9.93 35.7 24.25 47.48 14.32 11.78 33.52 19.34 54.77 19.34 19.74 0 36.01-5.95 47.7-14.89 11.7-8.94 19.19-20.88 19.19-20.88s-6.83-7.35-15.84-14.59c-9.01-7.23-18.2-13.4-18.2-13.4-4.14 5.76-7.94 9.63-11.65 12.2-3.71 2.58-7.43 3.95-12.96 3.95-7.07 0-15.82-3.72-21.97-9.97-6.16-6.25-9.48-14.54-9.48-22.25 0-7.71 3.32-14.55 9.48-19.4 6.16-4.85 14.9-7.77 21.97-7.77 10.73 0 20.2 6.25 20.2 6.25s10.85-12.58 25.35-22.81c14.5-10.23 32.58-17.46 51.93-17.46 19.35 0 36.26 7.23 49.93 17.46 13.67 10.23 24.1 23.26 30.87 36.88 6.77 13.63 9.88 27.84 9.88 40.68 0 12.84-3.11 24.31-9.88 33.4-6.77 9.09-17.2 15.78-30.87 15.78z"></path>
                </svg>
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
                            <div className="group bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                                <figure className="clearfix">
                                    <div className="relative mb-1">
                                        <Link title={manga.title} to={`/mangas/${manga.id}`} className="block">
                                            <div className="relative pb-[150%]">
                                                <div className="absolute inset-0 w-full h-full overflow-hidden">
                                                    <div className="relative h-full w-full">
                                                        <div className="absolute bottom-0 left-0 z-[1] h-3/5 w-full bg-gradient-to-t from-gray-900 from-[15%] to-transparent transition-all duration-500 group-hover:h-3/4"></div>
                                                        <img
                                                            src={getMangaImageUrl(manga.coverUrl)}
                                                            alt={manga.title}
                                                            className="absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
                                                        />
                                                        <div className="absolute bottom-0 left-0 z-[2] p-3 w-full">
                                                            <h3 className="text-white text-sm font-medium line-clamp-2 mb-1 group-hover:text-purple-400 transition-colors">
                                                                {manga.title}
                                                            </h3>
                                                            <p className="text-gray-400 text-xs line-clamp-1">
                                                                {manga.author}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                </figure>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default PersonalRecommendations;
