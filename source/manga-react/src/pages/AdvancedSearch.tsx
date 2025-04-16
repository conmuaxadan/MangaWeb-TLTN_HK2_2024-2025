import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/scrollbar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faFilter,
    faRedo,
    faChevronDown,
    faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import mangaService from '../services/manga-service.ts';
import { AdvancedSearchRequest, GenreResponse, MangaResponse } from '../interfaces/models/manga.ts';
const AdvancedSearch: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Lấy tham số từ URL
    const queryParams = new URLSearchParams(location.search);
    const keywordFromUrl = queryParams.get('keyword') || '';

    // State cho form tìm kiếm
    const [searchTitle, setSearchTitle] = useState<string>(keywordFromUrl);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [author, setAuthor] = useState<string>('');
    const [yearOfRelease, setYearOfRelease] = useState<number | undefined>(undefined);
    const [status, setStatus] = useState<string>('');
    const [orderBy, setOrderBy] = useState<string>('lastChapterAddedAt,desc');

    // State cho dropdown thể loại
    const [showGenreDropdown, setShowGenreDropdown] = useState<boolean>(false);

    // State cho kết quả tìm kiếm
    const [searchResults, setSearchResults] = useState<MangaResponse[]>([]);
    const [totalElements, setTotalElements] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // State cho danh sách thể loại
    const [genres, setGenres] = useState<GenreResponse[]>([]);

    // State cho việc hiển thị/ẩn bộ lọc nâng cao
    const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

    // Các tùy chọn cho dropdown
    const statusOptions = ['Tất cả', 'Đang tiến hành', 'Đã hoàn thành', 'Tạm ngưng'];
    const orderByOptions = [
        { value: 'lastChapterAddedAt,desc', label: 'Mới cập nhật' },
        { value: 'createdAt,desc', label: 'Truyện mới' },
        { value: 'loves,desc', label: 'Theo dõi nhiều nhất' },
        { value: 'title,asc', label: 'Bảng chữ cái' },
        { value: 'views,desc', label: 'Xem nhiều nhất' }
    ];

    // Các tùy chọn cho dropdown

    // Lấy danh sách thể loại và tìm kiếm ban đầu nếu có từ khóa
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const genresData = await mangaService.getAllGenres();
                if (genresData) {
                    setGenres(genresData);
                }
            } catch (error) {
                console.error('Lỗi khi lấy danh sách thể loại:', error);
                setError('Không thể tải danh sách thể loại');
            }
        };

        fetchGenres();

        // Nếu có từ khóa từ URL, thực hiện tìm kiếm ngay
        if (keywordFromUrl) {
            performSearch(0);
        }
    }, []);



    // Hàm xử lý khi thay đổi thể loại
    const handleGenreClick = (genreName: string) => {
        setSelectedGenres(prevGenres => {
            if (prevGenres.includes(genreName)) {
                return prevGenres.filter(g => g !== genreName);
            } else {
                return [...prevGenres, genreName];
            }
        });
    };

    // Hàm xử lý khi ẩn/hiện dropdown thể loại
    const toggleGenreDropdown = () => {
        setShowGenreDropdown(!showGenreDropdown);
    };



    // Hàm xử lý khi submit form tìm kiếm
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        // Cập nhật URL với từ khóa tìm kiếm
        if (searchTitle.trim()) {
            navigate(`/search?keyword=${encodeURIComponent(searchTitle.trim())}`, { replace: true });
        } else {
            navigate('/search', { replace: true });
        }

        await performSearch(0);
    };

    // Hàm thực hiện tìm kiếm
    const performSearch = async (page: number) => {
        try {
            setLoading(true);
            setError(null);

            const searchRequest: AdvancedSearchRequest = {
                title: searchTitle || undefined,
                author: author || undefined,
                genres: selectedGenres.length > 0 ? selectedGenres : undefined,
                yearOfRelease: yearOfRelease,
                status: status !== 'Tất cả' ? status : undefined,
                orderBy: orderBy
            };

            const results = await mangaService.advancedSearch(searchRequest, page, 10);
            if (results) {
                if (results.content.length === 0) {
                    // Không tìm thấy kết quả nào
                    setError('Không tìm thấy truyện nào phù hợp với tiêu chí tìm kiếm');
                    setSearchResults([]);
                    setTotalElements(0);
                    setTotalPages(0);
                } else {
                    setSearchResults(results.content);
                    setTotalElements(results.totalElements);
                    setTotalPages(results.totalPages);
                    setCurrentPage(page);
                }
            } else {
                setError('Không tìm thấy kết quả phù hợp');
                setSearchResults([]);
                setTotalElements(0);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Lỗi khi tìm kiếm:', error);
            setError('Đã xảy ra lỗi khi tìm kiếm');
            setSearchResults([]);
            setTotalElements(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý khi reset form
    const handleReset = () => {
        setSearchTitle('');
        setSelectedGenres([]);
        setAuthor('');
        setYearOfRelease(undefined);
        setStatus('');
        setOrderBy('lastChapterAddedAt,desc');
    };

    // Hàm xử lý khi chuyển trang
    const handlePageChange = (newPage: number) => {
        // Cập nhật URL với tham số trang
        const params = new URLSearchParams(location.search);
        if (searchTitle.trim()) {
            params.set('keyword', searchTitle.trim());
        }
        params.set('page', newPage.toString());
        navigate(`/search?${params.toString()}`, { replace: true });

        performSearch(newPage);
    };

    // Hàm xử lý khi thay đổi sắp xếp
    const handleOrderByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setOrderBy(e.target.value);
        // Thực hiện tìm kiếm lại ngay khi thay đổi sắp xếp
        if (searchResults.length > 0) {
            setTimeout(() => performSearch(0), 0);
        }
    };

    // Tạo các nút phân trang
    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pageButtons = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(0, Math.min(currentPage - Math.floor(maxVisiblePages / 2), totalPages - maxVisiblePages));
        let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages - 1);

        if (startPage > 0) {
            pageButtons.push(
                <button
                    key="first"
                    onClick={() => handlePageChange(0)}
                    className="px-3 py-1 mx-1 rounded bg-gray-700 text-white hover:bg-gray-600"
                >
                    1
                </button>
            );
            if (startPage > 1) {
                pageButtons.push(<span key="ellipsis1" className="px-3 py-1">...</span>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageButtons.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 mx-1 rounded ${
                        i === currentPage ? 'bg-purple-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                >
                    {i + 1}
                </button>
            );
        }

        if (endPage < totalPages - 1) {
            if (endPage < totalPages - 2) {
                pageButtons.push(<span key="ellipsis2" className="px-3 py-1">...</span>);
            }
            pageButtons.push(
                <button
                    key="last"
                    onClick={() => handlePageChange(totalPages - 1)}
                    className="px-3 py-1 mx-1 rounded bg-gray-700 text-white hover:bg-gray-600"
                >
                    {totalPages}
                </button>
            );
        }

        return (
            <div className="flex justify-center mt-6 mb-4">
                {currentPage > 0 && (
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="px-3 py-1 mx-1 rounded bg-gray-700 text-white hover:bg-gray-600"
                    >
                        &lt;
                    </button>
                )}
                {pageButtons}
                {currentPage < totalPages - 1 && (
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="px-3 py-1 mx-1 rounded bg-gray-700 text-white hover:bg-gray-600"
                    >
                        &gt;
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="bg-gray-900 text-white p-4">
            <div className="max-w-screen-xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-6">Tìm truyện nâng cao</h1>

                <form onSubmit={handleSearch} className="mb-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-grow">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchTitle}
                                    onChange={(e) => setSearchTitle(e.target.value)}
                                    className="w-full p-4 pl-10 text-sm rounded-lg bg-gray-800 border border-gray-700 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Nhập tên truyện..."
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <FontAwesomeIcon icon={faFilter} />
                            <span>{showAdvancedFilters ? 'Ẩn bộ lọc' : 'Hiển thị bộ lọc'}</span>
                            <FontAwesomeIcon icon={showAdvancedFilters ? faChevronUp : faChevronDown} />
                        </button>
                    </div>

                    {/* Bộ lọc nâng cao */}
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showAdvancedFilters ? 'max-h-[2000px]' : 'max-h-0'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                            {/* Thể loại */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium">Thể loại</label>
                                    <button
                                        type="button"
                                        onClick={toggleGenreDropdown}
                                        className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                    >
                                        {selectedGenres.length > 0 ? `Đã chọn ${selectedGenres.length}` : 'Chọn thể loại'}
                                        <FontAwesomeIcon
                                            icon={showGenreDropdown ? faChevronUp : faChevronDown}
                                            className="h-3 w-3"
                                        />
                                    </button>
                                </div>

                                {/* Dropdown thể loại */}
                                <div className="relative">
                                    <div className="w-full p-2.5 text-sm rounded-lg bg-gray-800 border border-gray-700 min-h-[40px] flex flex-wrap gap-1">
                                        {selectedGenres.length > 0 ? (
                                            selectedGenres.map(genre => (
                                                <span
                                                    key={genre}
                                                    className="px-2 py-1 text-xs rounded-lg bg-purple-600 text-white flex items-center gap-1"
                                                >
                                                    {genre}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGenreClick(genre)}
                                                        className="text-white hover:text-gray-200"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-400">Chưa chọn thể loại nào</span>
                                        )}
                                    </div>

                                    {showGenreDropdown && (
                                        <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
                                            <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-1">
                                                {genres.map((genre) => (
                                                    <div
                                                        key={genre.name}
                                                        onClick={() => handleGenreClick(genre.name)}
                                                        className={`px-2 py-1 text-sm rounded cursor-pointer ${selectedGenres.includes(genre.name) ? 'bg-purple-600 text-white' : 'hover:bg-gray-700'}`}
                                                    >
                                                        {genre.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tác giả */}
                            <div>
                                <label className="block mb-2 text-sm font-medium">Tác giả</label>
                                <input
                                    type="text"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    className="w-full p-2.5 text-sm rounded-lg bg-gray-800 border border-gray-700 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Nhập tên tác giả..."
                                />
                            </div>

                            {/* Năm phát hành */}
                            <div>
                                <label className="block mb-2 text-sm font-medium">Năm phát hành</label>
                                <input
                                    type="number"
                                    value={yearOfRelease || ''}
                                    onChange={(e) => setYearOfRelease(e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full p-2.5 text-sm rounded-lg bg-gray-800 border border-gray-700 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Nhập năm phát hành..."
                                    min="1900"
                                    max={new Date().getFullYear()}
                                />
                            </div>

                            {/* Tình trạng */}
                            <div>
                                <label className="block mb-2 text-sm font-medium">Tình trạng</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full p-2.5 text-sm rounded-lg bg-gray-800 border border-gray-700 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sắp xếp theo */}
                            <div>
                                <label className="block mb-2 text-sm font-medium">Sắp xếp theo</label>
                                <select
                                    value={orderBy}
                                    onChange={handleOrderByChange}
                                    className="w-full p-2.5 text-sm rounded-lg bg-gray-800 border border-gray-700 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    {orderByOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                            <div className="mb-4 md:mb-0 text-sm text-gray-400">
                                {selectedGenres.length > 0 && (
                                    <span>Đang lọc theo {selectedGenres.length} thể loại</span>
                                )}
                                {status !== 'Tất cả' && (
                                    <span>{selectedGenres.length > 0 ? ', ' : 'Đang lọc theo '}tình trạng {status}</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faRedo} />
                                    <span>Reset</span>
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faSearch} />
                                    <span>Tìm kiếm</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Hiển thị kết quả tìm kiếm */}
                <div>
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-500">{error}</div>
                    ) : searchResults.length > 0 ? (
                        <>
                            <div className="mb-4 text-gray-400">
                                Tìm thấy {totalElements} kết quả
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {searchResults.map((manga) => (
                                    <div key={manga.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                                        <a href={`/mangas/${manga.id}`} className="block">
                                            <div className="relative pb-[150%]">
                                                <img
                                                    src={"http://localhost:8888/api/v1/upload/files/"+manga.coverUrl || '/images/default-manga-cover.jpg'}
                                                    alt={manga.title}
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="p-3">
                                                <h3 className="text-sm font-medium line-clamp-2">{manga.title}</h3>
                                                <div className="mt-1 text-xs text-gray-400">
                                                    {manga.chapters.length > 0 ? `${manga.chapters.length} chapter` : 'Chưa có chapter'}
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                ))}
                            </div>
                            {renderPagination()}
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-400">
                            {error ? (
                                <div className="text-yellow-500 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {error}
                                </div>
                            ) : (
                                "Nhập từ khóa và nhấn tìm kiếm để bắt đầu"
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdvancedSearch;
