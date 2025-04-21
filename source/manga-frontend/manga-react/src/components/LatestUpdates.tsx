import { useEffect, useState } from 'react';
import mangaService from '../services/manga-service';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useSearchParams } from 'react-router-dom';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const [mangaList, setMangaList] = useState<MangaCardData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalElements, setTotalElements] = useState<number>(0);

    // Lấy trang hiện tại từ URL, mặc định là 0 (trang đầu tiên)
    const currentPage = parseInt(searchParams.get('page') || '0');
    const pageSize = 20; // Số truyện mỗi trang

    // Hàm chuyển đổi trang sang URL
    const handlePageChange = (page: number) => {
        setSearchParams({ page: page.toString() });
    };

    useEffect(() => {
        const fetchMangaSummaries = async () => {
            try {
                setLoading(true);
                const result = await mangaService.getMangaSummaries(currentPage, pageSize, "lastChapterAddedAt,desc");

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
                    setTotalPages(result.totalPages);
                    setTotalElements(result.totalElements);
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
    }, [currentPage, pageSize]);

    return (
        <div>
            <div className="relative mb-5 flex items-center justify-between">
                <h1 className="flex items-center gap-3 text-xl font-semibold text-white border-l-4 border-purple-600 pl-3">
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" className="text-purple-500 text-2xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M256,8C119,8,8,119,8,256S119,504,256,504,504,393,504,256,393,8,256,8Zm92.49,313h0l-20,25a16,16,0,0,1-22.49,2.5h0l-67-49.72a40,40,0,0,1-15-31.23V112a16,16,0,0,1,16-16h32a16,16,0,0,1,16,16V256l58,42.5A16,16,0,0,1,348.49,321Z"></path>
                    </svg>
                    <span>Truyện mới cập nhật</span>
                </h1>
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

            {totalPages > 1 && (
                <div className="mt-8">
                    <ul className="flex justify-center items-center space-x-2" role="navigation" aria-label="Pagination">
                        {/* Nút Previous */}
                        <li>
                            {currentPage > 0 ? (
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-white hover:bg-purple-500 transition-colors duration-200"
                                    aria-label="Previous page"
                                >
                                    &lt;
                                </button>
                            ) : (
                                <span className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-gray-400 cursor-not-allowed">
                                    &lt;
                                </span>
                            )}
                        </li>

                        {/* Trang đầu */}
                        {currentPage > 2 && (
                            <li>
                                <button
                                    onClick={() => handlePageChange(0)}
                                    className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-white hover:bg-purple-500 transition-colors duration-200"
                                    aria-label="Page 1"
                                >
                                    1
                                </button>
                            </li>
                        )}

                        {/* Dấu ... đầu */}
                        {currentPage > 3 && (
                            <li>
                                <span className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-white">
                                    ...
                                </span>
                            </li>
                        )}

                        {/* Trang trước */}
                        {currentPage > 0 && (
                            <li>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-white hover:bg-purple-500 transition-colors duration-200"
                                    aria-label={`Page ${currentPage}`}
                                >
                                    {currentPage}
                                </button>
                            </li>
                        )}

                        {/* Trang hiện tại */}
                        <li>
                            <span className="flex items-center justify-center w-10 h-10 rounded-md bg-purple-600 text-white font-medium" aria-current="page">
                                {currentPage + 1}
                            </span>
                        </li>

                        {/* Trang sau */}
                        {currentPage < totalPages - 1 && (
                            <li>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-white hover:bg-purple-500 transition-colors duration-200"
                                    aria-label={`Page ${currentPage + 2}`}
                                >
                                    {currentPage + 2}
                                </button>
                            </li>
                        )}

                        {/* Dấu ... cuối */}
                        {currentPage < totalPages - 4 && (
                            <li>
                                <span className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-white">
                                    ...
                                </span>
                            </li>
                        )}

                        {/* Trang cuối */}
                        {currentPage < totalPages - 3 && (
                            <li>
                                <button
                                    onClick={() => handlePageChange(totalPages - 1)}
                                    className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-white hover:bg-purple-500 transition-colors duration-200"
                                    aria-label={`Page ${totalPages}`}
                                >
                                    {totalPages}
                                </button>
                            </li>
                        )}

                        {/* Nút Next */}
                        <li>
                            {currentPage < totalPages - 1 ? (
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-white hover:bg-purple-500 transition-colors duration-200"
                                    aria-label="Next page"
                                >
                                    &gt;
                                </button>
                            ) : (
                                <span className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 text-gray-400 cursor-not-allowed">
                                    &gt;
                                </span>
                            )}
                        </li>
                    </ul>

                    <div className="text-center text-sm text-gray-400 mt-4">
                        Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} trong tổng số {totalElements} truyện
                    </div>
                </div>
            )}
        </div>
    );
};

export default LatestUpdates;
