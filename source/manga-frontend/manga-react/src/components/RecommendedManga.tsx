import { useEffect, useState } from 'react';
import mangaService from '../services/manga-service';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MangaData {
    id: string;
    title: string;
    coverUrl?: string;
    author?: string;
    lastChapterAddedAt?: string;
    lastChapterNumber?: number;
    lastChapterId?: string;
    views?: number;
    loves?: number;
    comments?: number;
}

const RecommendedManga = () => {
    const [recommendedManga, setRecommendedManga] = useState<MangaData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchRecommendedManga = async () => {
            try {
                setLoading(true);
                // Lấy 10 manga đề cử
                const result = await mangaService.getMangaSummaries(0, 10, "createdAt,desc");

                if (result) {
                    // Đảm bảo có đầy đủ thông tin cho mỗi manga
                    const mangaWithDetails = result.content.map(manga => ({
                        ...manga,
                        views: manga.views || 0,
                        loves: manga.loves || 0,
                        comments: manga.comments || 0
                    }));
                    setRecommendedManga(mangaWithDetails);
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
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" className="text-purple-500 text-2xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M256,8C119,8,8,119,8,256S119,504,256,504,504,393,504,256,393,8,256,8Zm92.49,313h0l-20,25a16,16,0,0,1-22.49,2.5h0l-67-49.72a40,40,0,0,1-15-31.23V112a16,16,0,0,1,16-16h32a16,16,0,0,1,16,16V256l58,42.5A16,16,0,0,1,348.49,321Z"></path>
                </svg>
                Truyện đề cử
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
                            <div className="group bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                                <figure className="clearfix">
                                    <div className="relative mb-1">
                                        <a title={manga.title} href={`/mangas/${manga.id}`} className="block">
                                            <div className="relative pb-[150%]">
                                                <div className="absolute inset-0 w-full h-full overflow-hidden">
                                                    <div className="relative h-full w-full">
                                                        <div className="absolute bottom-0 left-0 z-[1] h-3/5 w-full bg-gradient-to-t from-gray-900 from-[15%] to-transparent transition-all duration-500 group-hover:h-3/4"></div>
                                                        <img
                                                            src={`http://localhost:8888/api/v1/upload/files/${manga.coverUrl}`}
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
                                            <div className="absolute bottom-0 left-0 z-[2] w-full px-2 py-1">
                                                <h3 className="mb-1 line-clamp-1 text-xs font-semibold leading-tight text-white transition group-hover:line-clamp-2">
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
                                    <figcaption className="px-2 pb-2">
                                        <ul className="flex flex-col gap-0">
                                            <li className="flex items-center justify-between gap-x-1 text-[10px]">
                                                <a
                                                    title={manga.lastChapterNumber ? `C. ${manga.lastChapterNumber}` : 'Chưa có chapter'}
                                                    className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition visited:text-gray-400 hover:text-purple-400 text-gray-200"
                                                    href={manga.lastChapterId
                                                        ? `/mangas/${manga.id}/chapters/${manga.lastChapterId}`
                                                        : `/mangas/${manga.id}`}
                                                >
                                                    {manga.lastChapterNumber ? `C. ${manga.lastChapterNumber}` : 'Chưa có chapter'}
                                                </a>
                                                <span className="whitespace-nowrap leading-tight text-gray-400">
                                                    {manga.lastChapterAddedAt
                                                        ? formatDistanceToNow(new Date(manga.lastChapterAddedAt), { locale: vi }).replace('trước', '')
                                                        : 'Chưa cập nhật'}
                                                </span>
                                            </li>
                                        </ul>
                                    </figcaption>
                                </figure>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default RecommendedManga;
