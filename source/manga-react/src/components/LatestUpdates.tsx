import { useEffect, useState } from 'react';
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
    views: number;
    loves: number;
    comments: number;
    lastChapterId?: string;
}

const LatestUpdates: React.FC = () => {
    const [mangaList, setMangaList] = useState<MangaCardData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMangaSummaries = async () => {
            try {
                setLoading(true);
                const result = await mangaService.getMangaSummaries(0, 24, "lastChapterAddedAt,desc");

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
                        views: manga.views || 0,
                        loves: manga.loves || 0,
                        comments: manga.comments || 0,
                        lastChapterId: manga.lastChapterId
                    }));

                    setMangaList(processedData);
                    setError(null);
                    setLoading(false);
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
        <div>
            <div className="relative mb-5 flex items-center justify-between">
                <h1 className="flex items-center gap-3 text-xl font-semibold text-white border-l-4 border-purple-600 pl-3">
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" className="text-purple-500 text-2xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M256,8C119,8,8,119,8,256S119,504,256,504,504,393,504,256,393,8,256,8Zm92.49,313h0l-20,25a16,16,0,0,1-22.49,2.5h0l-67-49.72a40,40,0,0,1-15-31.23V112a16,16,0,0,1,16-16h32a16,16,0,0,1,16,16V256l58,42.5A16,16,0,0,1,348.49,321Z"></path>
                    </svg>
                    <span>Truyện mới cập nhật</span>
                </h1>
                <button className="rounded-full border-2 border-purple-500 p-3 text-purple-400 hover:bg-purple-500 hover:text-white transition-all duration-300" title="Lọc theo cài đặt">
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M487.976 0H24.028C2.71 0-8.047 25.866 7.058 40.971L192 225.941V432c0 7.831 3.821 15.17 10.237 19.662l80 55.98C298.02 518.69 320 507.493 320 487.98V225.941l184.947-184.97C520.021 25.896 509.338 0 487.976 0z"></path>
                    </svg>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            ) : error ? (
                <div className="text-red-500 text-center py-8">{error}</div>
            ) : (
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                    {mangaList.map((manga) => (
                        <div key={manga.id} className="group bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                            <figure className="clearfix">
                                <div className="relative mb-2">
                                    <a title={manga.title} href={manga.link} className="block">
                                        <div className="relative pb-[150%]">
                                            <div className="absolute inset-0 w-full h-full overflow-hidden">
                                                <div className="relative h-full w-full">
                                                    <div className="absolute bottom-0 left-0 z-[1] h-3/5 w-full bg-gradient-to-t from-gray-900 from-[15%] to-transparent transition-all duration-500 group-hover:h-3/4"></div>
                                                    <img
                                                        src={`http://localhost:8888/api/v1/upload/files/${manga.image}`}
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
                                        <div className="absolute bottom-0 left-0 z-[2] w-full px-3 py-2">
                                            <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-tight text-white transition group-hover:line-clamp-4">
                                                {manga.title}
                                            </h3>
                                            <span className="flex items-center justify-between gap-1 text-xs text-gray-300">
                                                <span className="flex items-center gap-1">
                                                    <i className="fa fa-eye text-yellow-500"></i>{manga.views}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <i className="fa fa-comment text-blue-400"></i>{manga.comments}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <i className="fa fa-heart text-red-500"></i>{manga.loves}
                                                </span>
                                            </span>
                                        </div>
                                    </a>
                                </div>
                                <figcaption className="px-3 pb-3">
                                    <ul className="flex flex-col gap-1">
                                        <li className="flex items-center justify-between gap-x-2 text-xs">
                                            <a
                                                title={manga.chapter}
                                                className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition visited:text-gray-400 hover:text-purple-400 text-gray-200"
                                                href={manga.chapterLink}
                                            >
                                                {manga.chapter}
                                            </a>
                                            <span className="whitespace-nowrap leading-tight text-gray-400">
                                                {manga.timeAgo.replace('trước', '')}
                                            </span>
                                        </li>
                                    </ul>
                                </figcaption>
                            </figure>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8">
                <ul className="flex justify-center items-center space-x-2" role="navigation" aria-label="Pagination">
                    <li>
                        <a className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-gray-400 cursor-not-allowed" tabIndex={-1} role="button" aria-disabled="true" aria-label="Previous page" rel="prev">
                            &lt;
                        </a>
                    </li>
                    <li>
                        <a className="flex items-center justify-center w-10 h-10 rounded-md bg-purple-600 text-white font-medium" rel="canonical" role="button" tabIndex={-1} aria-label="Page 1 is your current page" aria-current="page">
                            1
                        </a>
                    </li>
                    <li>
                        <a className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-white hover:bg-purple-500 transition-colors duration-200" rel="next" role="button" tabIndex={0} aria-label="Page 2">
                            2
                        </a>
                    </li>
                    <li>
                        <a className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-white hover:bg-purple-500 transition-colors duration-200" role="button" tabIndex={0} aria-label="Jump forward">
                            ...
                        </a>
                    </li>
                    <li>
                        <a className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-white hover:bg-purple-500 transition-colors duration-200" role="button" tabIndex={0} aria-label="Page 100">
                            100
                        </a>
                    </li>
                    <li>
                        <a className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-white hover:bg-purple-500 transition-colors duration-200" tabIndex={0} role="button" aria-disabled="false" aria-label="Next page" rel="next">
                            &gt;
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default LatestUpdates;
