import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy } from '@fortawesome/free-solid-svg-icons';
import useTopManga, { MangaData } from '../hooks/useTopManga';
import MangaListItem from './MangaListItem';

const TopManga = () => {
    const {
        activeTab,
        setActiveTab,
        loading,
        error,
        activeTabInfo,
        icons
    } = useTopManga();

    // Hàm render danh sách manga được tối ưu
    const renderMangaList = (mangas: MangaData[], icon: any, title: string, statIcon: any, statValue: (manga: MangaData) => string) => {
        if (!mangas || mangas.length === 0) {
            return (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={icon} />
                        {title}
                    </h3>
                    <p className="text-gray-500 text-center py-8">Không có dữ liệu</p>
                </div>
            );
        }

        return (
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={icon} />
                    {title}
                </h3>
                <ul className="flex flex-col divide-y divide-gray-200">
                    {mangas.map((manga, index) => (
                        <MangaListItem
                            key={manga.id}
                            manga={manga}
                            index={index}
                            statIcon={statIcon ? <FontAwesomeIcon icon={statIcon} /> : null}
                            statValue={statValue(manga)}
                        />
                    ))}
                </ul>
            </div>
        );
    };

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

    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 text-xl font-semibold text-gray-900 border-l-4 border-purple-600 pl-3">
                    <FontAwesomeIcon icon={faTrophy} className="text-purple-500 text-2xl" />
                    Bảng xếp hạng
                </h2>
            </div>

            <div className="w-full">
                <div className="flex rounded-lg overflow-hidden mb-6 bg-white border border-gray-200">
                    <button
                        type="button"
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'top' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('top')}
                    >
                        <FontAwesomeIcon icon={icons.view} />
                        Lượt xem
                    </button>
                    <button
                        type="button"
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'favorite' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('favorite')}
                    >
                        <FontAwesomeIcon icon={icons.love} />
                        Yêu thích
                    </button>
                    <button
                        type="button"
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'new' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('new')}
                    >
                        <FontAwesomeIcon icon={icons.new} />
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
