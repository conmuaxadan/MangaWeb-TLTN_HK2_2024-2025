import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faRedo,
    faChevronDown,
    faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import mangaService from '../services/manga-service.ts';
import { AdvancedSearchRequest, GenreResponse, MangaResponse, MangaStatus, MangaStatusDisplayNames } from '../interfaces/models/manga.ts';
import { getMangaImageUrl } from '../utils/file-utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const AdvancedSearch: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // State cho form tìm kiếm
    const [title, setTitle] = useState<string>('');
    const [author, setAuthor] = useState<string>('');
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [status, setStatus] = useState<MangaStatus | ''>('');
    const [yearOfRelease, setYearOfRelease] = useState<string>('');
    const [orderBy, setOrderBy] = useState<string>('lastChapterAddedAt,desc');
    const [showFilters, setShowFilters] = useState<boolean>(true);
    const [showGenres, setShowGenres] = useState<boolean>(true);

    // State cho kết quả tìm kiếm
    const [searchResults, setSearchResults] = useState<MangaResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalElements, setTotalElements] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [pageSize] = useState<number>(20);

    // State cho danh sách thể loại
    const [genres, setGenres] = useState<GenreResponse[]>([]);
    const [loadingGenres, setLoadingGenres] = useState<boolean>(true);

    // Lấy danh sách thể loại khi component được mount
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                setLoadingGenres(true);
                const genresData = await mangaService.getAllGenres();
                if (genresData) {
                    setGenres(genresData);
                }
            } catch (error) {
                console.error('Lỗi khi lấy danh sách thể loại:', error);
            } finally {
                setLoadingGenres(false);
            }
        };

        fetchGenres();
    }, []);

    // Xử lý query params khi component được mount hoặc URL thay đổi
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);

        // Lấy các tham số tìm kiếm từ URL
        const keywordParam = searchParams.get('keyword') || '';
        const titleParam = searchParams.get('title') || keywordParam; // Sử dụng keyword làm title nếu không có title
        const authorParam = searchParams.get('author') || '';
        const genresParam = searchParams.get('genres') || '';
        const statusParam = searchParams.get('status') || '';
        const yearParam = searchParams.get('year') || '';
        const orderByParam = searchParams.get('orderBy') || 'lastChapterAddedAt,desc';
        const pageParam = parseInt(searchParams.get('page') || '0');

        // Cập nhật state
        setTitle(titleParam);
        setAuthor(authorParam);
        setSelectedGenres(genresParam ? genresParam.split(',') : []);
        setStatus(statusParam as MangaStatus || '');
        setYearOfRelease(yearParam);
        setOrderBy(orderByParam);
        setCurrentPage(pageParam);

        // Nếu có ít nhất một tham số tìm kiếm, thực hiện tìm kiếm
        if (titleParam || authorParam || genresParam || statusParam || yearParam || keywordParam) {
            performSearch(
                titleParam,
                authorParam,
                genresParam ? genresParam.split(',') : [],
                statusParam as MangaStatus || '',
                yearParam ? parseInt(yearParam) : undefined,
                orderByParam,
                pageParam
            );
        }
    }, [location.search]);

    // Hàm thực hiện tìm kiếm
    const performSearch = async (
        searchTitle: string,
        searchAuthor: string,
        searchGenres: string[],
        searchStatus: MangaStatus | '',
        searchYear?: number,
        searchOrderBy: string = 'lastChapterAddedAt,desc',
        page: number = 0
    ) => {
        setLoading(true);
        setError(null);

        try {
            const searchParams: AdvancedSearchRequest = {
                title: searchTitle || undefined,
                author: searchAuthor || undefined,
                genres: searchGenres.length > 0 ? searchGenres : undefined,
                status: searchStatus || undefined,
                yearOfRelease: searchYear,
                orderBy: searchOrderBy
            };

            const results = await mangaService.advancedSearch(searchParams, page, pageSize);

            if (results) {
                setSearchResults(results.content);
                setTotalPages(results.totalPages);
                setTotalElements(results.totalElements);
            } else {
                setSearchResults([]);
                setTotalPages(0);
                setTotalElements(0);
            }
        } catch (error) {
            console.error('Lỗi khi tìm kiếm:', error);
            setError('Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại sau.');
            setSearchResults([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý submit form
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Tạo object chứa các tham số tìm kiếm
        const params: Record<string, string> = {};

        if (title) params.title = title;
        if (author) params.author = author;
        if (selectedGenres.length > 0) params.genres = selectedGenres.join(',');
        if (status) params.status = status;
        if (yearOfRelease) params.year = yearOfRelease;
        params.orderBy = orderBy;
        params.page = '0'; // Reset về trang đầu tiên khi tìm kiếm mới

        // Chuyển hướng đến URL với các tham số tìm kiếm
        navigate({
            pathname: '/search',
            search: new URLSearchParams(params).toString()
        });
    };

    // Hàm xử lý reset form
    const handleReset = () => {
        setTitle('');
        setAuthor('');
        setSelectedGenres([]);
        setStatus('');
        setYearOfRelease('');
        setOrderBy('lastChapterAddedAt,desc');

        // Chuyển hướng đến URL không có tham số tìm kiếm
        navigate('/search');
    };

    // Hàm xử lý chọn/bỏ chọn thể loại
    const handleGenreToggle = (genre: string) => {
        setSelectedGenres(prev =>
            prev.includes(genre)
                ? prev.filter(g => g !== genre)
                : [...prev, genre]
        );
    };

    // Hàm xử lý chuyển trang
    const handlePageChange = (page: number) => {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('page', page.toString());

        navigate({
            pathname: '/search',
            search: searchParams.toString()
        });
    };

    // Render phân trang
    const renderPagination = () => {
        if (totalPages <= 1) return null;

        return (
            <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-1">
                    {/* Nút Previous */}
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className={`px-3 py-1 rounded-md ${
                            currentPage === 0
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        &laquo;
                    </button>

                    {/* Các nút số trang */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Tính toán số trang hiển thị
                        let pageNum;
                        if (totalPages <= 5) {
                            // Nếu tổng số trang <= 5, hiển thị tất cả
                            pageNum = i;
                        } else if (currentPage < 3) {
                            // Nếu đang ở 3 trang đầu, hiển thị 5 trang đầu
                            pageNum = i;
                        } else if (currentPage > totalPages - 3) {
                            // Nếu đang ở 3 trang cuối, hiển thị 5 trang cuối
                            pageNum = totalPages - 5 + i;
                        } else {
                            // Hiển thị 2 trang trước, trang hiện tại, và 2 trang sau
                            pageNum = currentPage - 2 + i;
                        }

                        return (
                            <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md ${
                                    currentPage === pageNum
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {pageNum + 1}
                            </button>
                        );
                    })}

                    {/* Nút Next */}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        className={`px-3 py-1 rounded-md ${
                            currentPage === totalPages - 1
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        &raquo;
                    </button>
                </nav>
            </div>
        );
    };

    return (
        <div className="bg-gray-100 text-gray-900 min-h-screen">
            <div className="container mx-auto px-4 py-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-2">Tìm kiếm nâng cao</h1>
                    <p className="text-gray-600">
                        Tìm kiếm truyện theo nhiều tiêu chí khác nhau
                    </p>
                </div>

                {/* Form tìm kiếm */}
                <div className="bg-white rounded-lg shadow-lg p-4 mb-8 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Bộ lọc tìm kiếm</h2>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <FontAwesomeIcon icon={showFilters ? faChevronUp : faChevronDown} />
                        </button>
                    </div>

                    {showFilters && (
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                {/* Tên truyện */}
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-600 mb-1">
                                        Tên truyện
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Nhập tên truyện..."
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                {/* Tác giả */}
                                <div>
                                    <label htmlFor="author" className="block text-sm font-medium text-gray-600 mb-1">
                                        Tác giả
                                    </label>
                                    <input
                                        type="text"
                                        id="author"
                                        value={author}
                                        onChange={(e) => setAuthor(e.target.value)}
                                        placeholder="Nhập tên tác giả..."
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                {/* Tình trạng */}
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-600 mb-1">
                                        Tình trạng
                                    </label>
                                    <select
                                        id="status"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as MangaStatus | '')}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">Tất cả</option>
                                        {Object.entries(MangaStatusDisplayNames).map(([key, value]) => (
                                            <option key={key} value={key}>
                                                {value}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Năm phát hành */}
                                <div>
                                    <label htmlFor="year" className="block text-sm font-medium text-gray-600 mb-1">
                                        Năm phát hành
                                    </label>
                                    <select
                                        id="year"
                                        value={yearOfRelease}
                                        onChange={(e) => setYearOfRelease(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">Tất cả</option>
                                        {Array.from(
                                            { length: new Date().getFullYear() - 1980 + 1 },
                                            (_, i) => new Date().getFullYear() - i
                                        ).map((year) => (
                                            <option key={year} value={year.toString()}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sắp xếp theo */}
                                <div>
                                    <label htmlFor="orderBy" className="block text-sm font-medium text-gray-600 mb-1">
                                        Sắp xếp theo
                                    </label>
                                    <select
                                        id="orderBy"
                                        value={orderBy}
                                        onChange={(e) => setOrderBy(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="lastChapterAddedAt,desc">Mới cập nhật</option>
                                        <option value="lastChapterAddedAt,asc">Cũ nhất</option>
                                        <option value="title,asc">Tên A-Z</option>
                                        <option value="title,desc">Tên Z-A</option>
                                        <option value="views,desc">Lượt xem nhiều nhất</option>
                                        <option value="loves,desc">Lượt thích nhiều nhất</option>
                                        <option value="yearOfRelease,desc">Năm phát hành (mới nhất)</option>
                                        <option value="yearOfRelease,asc">Năm phát hành (cũ nhất)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Thể loại */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-600">
                                        Thể loại {selectedGenres.length > 0 && `(${selectedGenres.length} đã chọn)`}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowGenres(!showGenres)}
                                        className="text-gray-500 hover:text-gray-900 transition-colors"
                                    >
                                        <FontAwesomeIcon icon={showGenres ? faChevronUp : faChevronDown} />
                                    </button>
                                </div>

                                {showGenres && (
                                    loadingGenres ? (
                                        <div className="flex justify-center items-center h-20">
                                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                            {genres.map((genre) => (
                                                <div
                                                    key={genre.name}
                                                    className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                                                        selectedGenres.includes(genre.name)
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                    onClick={() => handleGenreToggle(genre.name)}
                                                >
                                                    {genre.name}
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Nút tìm kiếm và reset */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center justify-center transition-colors"
                                >
                                    <FontAwesomeIcon icon={faSearch} className="mr-2" />
                                    Tìm kiếm
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md flex items-center justify-center transition-colors"
                                >
                                    <FontAwesomeIcon icon={faRedo} className="mr-2" />
                                    Đặt lại
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Kết quả tìm kiếm */}
                <div>
                    {/* Tiêu đề kết quả */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">
                            {totalElements > 0
                                ? `Kết quả tìm kiếm (${totalElements})`
                                : 'Kết quả tìm kiếm'}
                        </h2>
                        <div className="text-sm text-gray-600">
                            {totalElements > 0 && (
                                <>
                                    Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} / {totalElements}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Hiển thị kết quả */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/20 text-red-400 p-4 rounded-lg">
                            <p>{error}</p>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="bg-white p-8 rounded-lg text-center border border-gray-200">
                            <FontAwesomeIcon icon={faSearch} className="text-4xl text-gray-400 mb-4" />
                            <h3 className="text-xl font-medium mb-2 text-gray-900">Không tìm thấy kết quả</h3>
                            <p className="text-gray-500">
                                Không tìm thấy truyện nào phù hợp với tiêu chí tìm kiếm của bạn.
                                <br />
                                Hãy thử thay đổi các tiêu chí tìm kiếm và thử lại.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Grid hiển thị kết quả */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                                {searchResults.map((manga) => (
                                    <div key={manga.id} className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200">
                                        <figure className="clearfix">
                                            <div className="relative mb-2">
                                                <a title={manga.title} href={`/mangas/${manga.id}`} className="block">
                                                    <div className="relative pb-[150%]">
                                                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                                                            <div className="relative h-full w-full">
                                                                <div className="absolute bottom-0 left-0 z-[1] h-3/5 w-full bg-gradient-to-t from-gray-900/80 from-[15%] to-transparent transition-all duration-500 group-hover:h-3/4"></div>
                                                                <img
                                                                    src={getMangaImageUrl(manga.coverUrl)}
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
                                                        <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-tight text-white transition group-hover:line-clamp-4">
                                                            {manga.title}
                                                        </h3>
                                                        <p className="mb-1 text-xs text-gray-300 line-clamp-1">{manga.author || 'Không rõ'}</p>
                                                        <span className="flex items-center justify-between gap-1 text-xs text-gray-300">
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
                                            <figcaption className="px-3 pb-3">
                                                <ul className="flex flex-col gap-1">
                                                    <li className="flex items-center justify-between gap-x-2 text-xs">
                                                        {manga.chapters && manga.chapters.length > 0 ? (
                                                            <a
                                                                title={`Chapter ${manga.chapters.length}`}
                                                                className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition visited:text-gray-500 hover:text-purple-600 text-gray-700"
                                                                href={`/mangas/${manga.id}/chapters/${manga.chapters[manga.chapters.length - 1]}`}
                                                            >
                                                                Chapter {manga.chapters.length}
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-500">Chưa có chapter</span>
                                                        )}
                                                        {manga.lastChapterAddedAt && (
                                                            <span className="whitespace-nowrap leading-tight text-gray-500">
                                                                {formatDistanceToNow(new Date(manga.lastChapterAddedAt), { locale: vi }).replace('trước', '')}
                                                            </span>
                                                        )}
                                                    </li>
                                                </ul>
                                            </figcaption>
                                        </figure>
                                    </div>
                                ))}
                            </div>

                            {/* Phân trang */}
                            {renderPagination()}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdvancedSearch;
