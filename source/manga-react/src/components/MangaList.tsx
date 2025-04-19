import { useEffect, useState } from 'react';
import MangaCard from './MangaCard';
import mangaService from '../services/manga-service';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// Định nghĩa interface cho dữ liệu manga đã được xử lý
interface MangaCardData {
    id: string;
    title: string;
    image: string;
    chapter: string;
    timeAgo: string;
    link: string;
    chapterLink: string;
    lastChapterId?: string;
}

const MangaList: React.FC = () => {
    const [mangaList, setMangaList] = useState<MangaCardData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMangaSummaries = async () => {
            try {
                setLoading(true);
                const result = await mangaService.getMangaSummaries(0, 18, "lastChapterAddedAt,desc");

                if (result) {
                    // Chuyển đổi dữ liệu từ API sang định dạng phù hợp với MangaCard
                    const processedData = result.content.map(manga => ({
                        id: manga.id,
                        title: manga.title,
                        image: manga.coverUrl || '/images/default-manga-cover.jpg',
                        chapter: manga.lastChapterNumber ? `C. ${manga.lastChapterNumber}` : 'Chưa có chapter',
                        timeAgo: manga.lastChapterAddedAt
                            ? formatDistanceToNow(new Date(manga.lastChapterAddedAt), { addSuffix: true, locale: vi })
                            : 'Chưa cập nhật',
                        link: `/mangas/${manga.id}`,
                        chapterLink: manga.lastChapterId
                            ? `/mangas/${manga.id}/chapters/${manga.lastChapterId}`
                            : `/mangas/${manga.id}`,
                        lastChapterId: manga.lastChapterId
                    }));

                    setMangaList(processedData);
                    setError(null);
                } else {
                    setError("Không thể tải danh sách manga");
                }
            } catch (err) {
                console.error("Lỗi khi tải danh sách manga:", err);
                setError("Đã xảy ra lỗi khi tải danh sách manga");
            } finally {
                setLoading(false);
            }
        };

        fetchMangaSummaries();
    }, []);

    return (
        <div className="flex-grow min-h-screen">
            <div className="mx-2 py-8 lg:py-16">
                <div className="common-container mb-8 lg:mb-12">
                    <div className="uppercase font-bold text-xl text-gray-300">
                        Mới cập nhật
                    </div>
                </div>

                <div className="common-container">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : error ? (
                        <div className="text-red-500 text-center py-8">{error}</div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
                            {mangaList.map((manga) => (
                                <MangaCard key={manga.id} manga={manga}/>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex justify-end mt-5">
                    <a
                        href="/newest"
                        className="flex items-center text-gray-600 hover:text-blue-600 transition text-sm font-bold cursor-pointer"
                    >
                        {/* Chevron Right Icon */}
                        <span className="mr-1">{'>'} </span>
                        {/* Text */}
                        <span>Xem danh sách truyện</span>
                    </a>
                </div>
            </div>

        </div>
    );
};

export default MangaList;