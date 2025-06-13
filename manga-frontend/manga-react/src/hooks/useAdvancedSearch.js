import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import mangaService from '../services/manga-service.js';

export const useAdvancedSearch = (pageSize = 20) => {
    const location = useLocation();
    const navigate = useNavigate();

    // State cho form tìm kiếm
    const [filters, setFilters] = useState({
        title: '',
        author: '',
        selectedGenres: [],
        status: '',
        yearOfRelease: '',
        orderBy: 'lastChapterAddedAt,desc'
    });

    // State cho UI
    const [showFilters, setShowFilters] = useState(true);
    const [showGenres, setShowGenres] = useState(true);

    // State cho kết quả tìm kiếm
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);

    // State cho danh sách thể loại
    const [genres, setGenres] = useState([]);
    const [loadingGenres, setLoadingGenres] = useState(true);

    // Hàm format số lượng (views, comments, loves)
    const formatCount = useCallback((count) => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    }, []);

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
        const titleParam = searchParams.get('title') || keywordParam;
        const authorParam = searchParams.get('author') || '';
        const genresParam = searchParams.get('genres') || '';
        const statusParam = searchParams.get('status') || '';
        const yearParam = searchParams.get('year') || '';
        const orderByParam = searchParams.get('orderBy') || 'lastChapterAddedAt,desc';
        const pageParam = parseInt(searchParams.get('page') || '0');

        // Cập nhật state
        setFilters({
            title: titleParam,
            author: authorParam,
            selectedGenres: genresParam ? genresParam.split(',') : [],
            status: statusParam || '',
            yearOfRelease: yearParam,
            orderBy: orderByParam
        });
        setCurrentPage(pageParam);

        // Nếu có ít nhất một tham số tìm kiếm, thực hiện tìm kiếm
        if (titleParam || authorParam || genresParam || statusParam || yearParam || keywordParam) {
            performSearch(
                titleParam,
                authorParam,
                genresParam ? genresParam.split(',') : [],
                statusParam || '',
                yearParam ? parseInt(yearParam) : undefined,
                orderByParam,
                pageParam
            );
        }
    }, [location.search]);

    // Hàm thực hiện tìm kiếm
    const performSearch = useCallback(async (
        searchTitle,
        searchAuthor,
        searchGenres,
        searchStatus,
        searchYear,
        searchOrderBy = 'lastChapterAddedAt,desc',
        page = 0
    ) => {
        setLoading(true);
        setError(null);

        try {
            const searchParams = {
                title: searchTitle || undefined,
                author: searchAuthor || undefined,
                genres: searchGenres.length > 0 ? searchGenres : undefined,
                status: searchStatus || undefined,
                yearOfRelease: searchYear,
                // Bỏ orderBy theo yêu cầu - sử dụng mặc định của backend
            };

            const results = await mangaService.advancedSearch(searchParams, page, pageSize, searchOrderBy);

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
    }, [pageSize]);

    // Hàm xử lý submit form
    const handleSubmit = useCallback((e) => {
        e.preventDefault();

        // Tạo object chứa các tham số tìm kiếm
        const params = {};

        if (filters.title) params.title = filters.title;
        if (filters.author) params.author = filters.author;
        if (filters.selectedGenres.length > 0) params.genres = filters.selectedGenres.join(',');
        if (filters.status) params.status = filters.status;
        if (filters.yearOfRelease) params.year = filters.yearOfRelease;
        if (filters.orderBy) params.orderBy = filters.orderBy;
        params.page = '0'; // Reset về trang đầu tiên khi tìm kiếm mới

        // Chuyển hướng đến URL với các tham số tìm kiếm
        navigate({
            pathname: '/search',
            search: new URLSearchParams(params).toString()
        });
    }, [filters, navigate]);

    // Hàm xử lý reset form
    const handleReset = useCallback(() => {
        setFilters({
            title: '',
            author: '',
            selectedGenres: [],
            status: '',
            yearOfRelease: '',
            orderBy: 'lastChapterAddedAt,desc'
        });

        // Chuyển hướng đến URL không có tham số tìm kiếm
        navigate('/search');
    }, [navigate]);

    // Hàm xử lý chọn/bỏ chọn thể loại
    const handleGenreToggle = useCallback((genre) => {
        setFilters(prev => ({
            ...prev,
            selectedGenres: prev.selectedGenres.includes(genre)
                ? prev.selectedGenres.filter(g => g !== genre)
                : [...prev.selectedGenres, genre]
        }));
    }, []);

    // Hàm xử lý chuyển trang
    const handlePageChange = useCallback((page) => {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('page', page.toString());

        navigate({
            pathname: '/search',
            search: searchParams.toString()
        });
    }, [location.search, navigate]);

    // Hàm cập nhật filters
    const updateFilters = useCallback((updates) => {
        setFilters(prev => ({ ...prev, ...updates }));
    }, []);

    return {
        // Data
        searchResults,
        genres,

        // Filters
        filters,
        updateFilters,

        // UI State
        showFilters,
        setShowFilters,
        showGenres,
        setShowGenres,

        // Search State
        loading,
        error,
        totalPages,
        totalElements,
        currentPage,
        pageSize,
        loadingGenres,

        // Actions
        handleSubmit,
        handleReset,
        handleGenreToggle,
        handlePageChange,

        // Utils
        formatCount
    };
};

export default useAdvancedSearch;
