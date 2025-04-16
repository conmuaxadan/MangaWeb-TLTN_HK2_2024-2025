import { useEffect, useState } from 'react';
import mangaService from '../services/manga-service';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MangaData {
    id: string;
    title: string;
    coverUrl: string;
    author: string;
    lastChapterAddedAt: string;
}

const RecommendedManga = () => {
    const [recommendedManga, setRecommendedManga] = useState<MangaData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchRecommendedManga = async () => {
            try {
                setLoading(true);
                // Lấy 12 manga được đánh giá cao nhất
                const result = await mangaService.getMangaSummaries(0, 12, "rating,desc");

                if (result) {
                    setRecommendedManga(result.content);
                }
            } catch (error) {
                console.error('Lỗi khi tải truyện đề cử:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendedManga();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <h2 className="flex items-center gap-3 text-xl font-semibold text-white border-l-4 border-purple-600 pl-3 mb-4">
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 384 512" className="text-purple-500 text-2xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M216 23.86c0-23.8-30.65-32.77-44.15-13.04C48 191.85 224 200 224 288c0 35.63-29.11 64.46-64.85 63.99-35.17-.45-63.15-29.77-63.15-64.94v-85.51c0-21.7-26.47-32.23-41.43-16.5C27.8 213.16 0 261.33 0 320c0 105.87 86.13 192 192 192s192-86.13 192-192c0-170.29-168-193-168-296.14z"></path>
                </svg>
                Truyện đề cử
            </h2>
            <div>
                <Swiper
                    modules={[Navigation]}
                    spaceBetween={20}
                    slidesPerView={1}
                    navigation
                    loop={true}
                    breakpoints={{
                        640: {
                            slidesPerView: 3,
                        },
                        768: {
                            slidesPerView: 4,
                        },
                        1024: {
                            slidesPerView: 5,
                        },
                    }}
                >
                    {recommendedManga.map((manga) => (
                        <SwiperSlide key={manga.id}>
                            <div className="item bg-black bg-cover">
                                <a
                                    title={manga.title}
                                    className="group relative block h-full w-full bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                                    href={`/mangas/${manga.id}`}
                                >
                                    <div className="relative pb-[150%]">
                                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                                            <div className="relative h-full w-full">
                                                <div className="absolute bottom-0 left-0 z-[1] h-2/5 w-full bg-gradient-to-t from-gray-900 from-[10%] to-transparent transition-all duration-500 group-hover:h-3/5"></div>
                                                <img
                                                    src={`http://localhost:8888/api/v1/upload/files/${manga.coverUrl}`}
                                                    alt={manga.title}
                                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[102%]"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = '/images/default-manga-cover.jpg';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 z-[2] w-full px-3 py-2 transition-all">
                                        <h3 className="mb-1 line-clamp-2 text-base font-semibold leading-tight text-white group-hover:line-clamp-4">
                                            {manga.title}
                                        </h3>
                                        <a className="text-purple-400 text-sm transition hover:text-purple-300" href={`/mangas/${manga.id}`}>
                                            {manga.author || 'Không rõ tác giả'}
                                        </a>
                                        <p className="time mb-0 mt-1 flex h-0 items-center gap-2 overflow-hidden text-xs text-gray-300 group-hover:h-auto">
                                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" className="text-purple-400" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M256,8C119,8,8,119,8,256S119,504,256,504,504,393,504,256,393,8,256,8Zm92.49,313h0l-20,25a16,16,0,0,1-22.49,2.5h0l-67-49.72a40,40,0,0,1-15-31.23V112a16,16,0,0,1,16-16h32a16,16,0,0,1,16,16V256l58,42.5A16,16,0,0,1,348.49,321Z"></path>
                                            </svg>
                                            <span>
                                                {manga.lastChapterAddedAt
                                                    ? formatDistanceToNow(new Date(manga.lastChapterAddedAt), { locale: vi }) + ' trước'
                                                    : 'Chưa cập nhật'}
                                            </span>
                                        </p>
                                    </div>
                                </a>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default RecommendedManga;
