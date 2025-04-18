import { useEffect, useState } from 'react';
import mangaService from '../services/manga-service';

interface MangaData {
    id: string;
    title: string;
    coverUrl: string;
    views?: number;
    loves?: number;
}

type TabType = 'top' | 'favorite' | 'new';

const TopManga = () => {
    const [topViewMangas, setTopViewMangas] = useState<MangaData[]>([]);
    const [topLoveMangas, setTopLoveMangas] = useState<MangaData[]>([]);
    const [newMangas, setNewMangas] = useState<MangaData[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('top');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchAllRankings = async () => {
            try {
                setLoading(true);

                // Lấy top 5 truyện có lượt xem cao nhất
                const topViewsResult = await mangaService.getMangaSummaries(0, 5, "views,desc");
                if (topViewsResult) {
                    setTopViewMangas(topViewsResult.content);
                }

                // Lấy top 5 truyện được yêu thích nhiều nhất
                const topLovesResult = await mangaService.getMangaSummaries(0, 5, "loves,desc");
                if (topLovesResult) {
                    setTopLoveMangas(topLovesResult.content);
                }

                // Lấy 5 truyện mới nhất
                const newMangasResult = await mangaService.getMangaSummaries(0, 5, "createdAt,desc");
                if (newMangasResult) {
                    setNewMangas(newMangasResult.content);
                }
            } catch (error) {
                console.error('Lỗi khi tải bảng xếp hạng:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllRankings();
    }, []);

    // Hàm render danh sách manga
    const renderMangaList = (mangas: MangaData[], icon: React.ReactNode, title: string, statIcon: React.ReactNode, statValue: (manga: MangaData) => string) => {
        return (
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    {icon}
                    {title}
                </h3>
                <ul className="flex flex-col divide-y divide-gray-700">
                    {mangas.map((manga, index) => (
                        <li key={manga.id} className="relative flex items-center gap-4 py-3 px-2 hover:bg-gray-800 transition-colors rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8">
                                <span className={`text-2xl font-black ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-700' : 'text-gray-500'}`}>
                                    {index + 1}
                                </span>
                            </div>
                            <a
                                className="relative w-12 h-12 shrink-0 rounded overflow-hidden shadow-lg"
                                title={manga.title}
                                href={`/mangas/${manga.id}`}
                            >
                                <img
                                    className="h-full w-full object-cover"
                                    src={`http://localhost:8888/api/v1/upload/files/${manga.coverUrl}`}
                                    alt={manga.title}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/images/default-manga-cover.jpg';
                                    }}
                                />
                            </a>
                            <div className="flex-1 min-w-0">
                                <h3 className="truncate">
                                    <a
                                        className="text-sm font-medium text-white hover:text-purple-400 transition-colors"
                                        href={`/mangas/${manga.id}`}
                                    >
                                        {manga.title}
                                    </a>
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    {statIcon && statIcon}
                                    {statValue(manga)}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    // Các icon
    const viewIcon = (
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 576 512" className="text-blue-500" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"></path>
        </svg>
    );

    const loveIcon = (
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" className="text-red-500" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"></path>
        </svg>
    );

    const newIcon = (
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" className="text-green-500" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M256,8C119,8,8,119,8,256S119,504,256,504,504,393,504,256,393,8,256,8Zm92.49,313h0l-20,25a16,16,0,0,1-22.49,2.5h0l-67-49.72a40,40,0,0,1-15-31.23V112a16,16,0,0,1,16-16h32a16,16,0,0,1,16,16V256l58,42.5A16,16,0,0,1,348.49,321Z"></path>
        </svg>
    );

    const starIcon = (
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 576 512" className="text-yellow-500" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path>
        </svg>
    );

    // Hàm lấy dữ liệu và icon cho tab đang active
    const getActiveTabData = () => {
        switch (activeTab) {
            case 'top':
                return {
                    data: topViewMangas,
                    icon: viewIcon,
                    title: "Top lượt xem",
                    statIcon: viewIcon,
                    statValue: (manga: MangaData) => `${manga.views?.toLocaleString() || 0} lượt xem`
                };
            case 'favorite':
                return {
                    data: topLoveMangas,
                    icon: loveIcon,
                    title: "Top yêu thích",
                    statIcon: loveIcon,
                    statValue: (manga: MangaData) => `${manga.loves?.toLocaleString() || 0} lượt thích`
                };
            case 'new':
                return {
                    data: newMangas,
                    icon: newIcon,
                    title: "Truyện mới",
                    statIcon: null,
                    statValue: () => "Mới cập nhật"
                };
            default:
                return {
                    data: topViewMangas,
                    icon: viewIcon,
                    title: "Top lượt xem",
                    statIcon: viewIcon,
                    statValue: (manga: MangaData) => `${manga.views?.toLocaleString() || 0} lượt xem`
                };
        }
    };

    const activeTabInfo = getActiveTabData();

    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 text-xl font-semibold text-white border-l-4 border-purple-600 pl-3">
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 576 512" className="text-purple-500 text-2xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M552 64H448V24c0-13.3-10.7-24-24-24H152c-13.3 0-24 10.7-24 24v40H24C10.7 64 0 74.7 0 88v56c0 35.7 22.5 72.4 61.9 100.7 31.5 22.7 69.8 37.1 110 41.7C203.3 338.5 240 360 240 360v72h-48c-35.3 0-64 20.7-64 56v12c0 6.6 5.4 12 12 12h296c6.6 0 12-5.4 12-12v-12c0-35.3-28.7-56-64-56h-48v-72s36.7-21.5 68.1-73.6c40.3-4.6 78.6-19 110-41.7 39.3-28.3 61.9-65 61.9-100.7V88c0-13.3-10.7-24-24-24zM99.3 192.8C74.9 175.2 64 155.6 64 144v-16h64.2c1 32.6 5.8 61.2 12.8 86.2-15.1-5.2-29.2-12.4-41.7-21.4zM512 144c0 16.1-17.7 36.1-35.3 48.8-12.5 9-26.7 16.2-41.8 21.4 7-25 11.8-53.6 12.8-86.2H512v16z"></path>
                    </svg>
                    Bảng xếp hạng
                </h2>
            </div>

            <div className="w-full">
                <div className="flex rounded-lg overflow-hidden mb-6 bg-gray-800 border border-gray-700">
                    <button
                        type="button"
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'top' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                        onClick={() => setActiveTab('top')}
                    >
                        {viewIcon}
                        Lượt xem
                    </button>
                    <button
                        type="button"
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'favorite' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                        onClick={() => setActiveTab('favorite')}
                    >
                        {loveIcon}
                        Yêu thích
                    </button>
                    <button
                        type="button"
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'new' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                        onClick={() => setActiveTab('new')}
                    >
                        {newIcon}
                        Mới nhất
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : (
                    renderMangaList(
                        activeTabInfo.data,
                        activeTabInfo.icon,
                        activeTabInfo.title,
                        activeTabInfo.statIcon,
                        activeTabInfo.statValue
                    )
                )}
            </div>
        </div>
    );
};

export default TopManga;
