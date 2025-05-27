import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import mangaService from '../services/manga-service';
import {MangaSummaryResponse, PageResponse} from '../interfaces/models/manga';

export const useGenreDetail = (pageSize: number = 18) => {
    const { genreName } = useParams<{ genreName: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    // State cho dữ liệu
    const [data, setData] = useState<PageResponse<MangaSummaryResponse> | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State cho pagination
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalElements, setTotalElements] = useState<number>(0);

    // Lấy trang hiện tại từ URL, mặc định là 0 (trang đầu tiên)
    const currentPage = parseInt(searchParams.get('page') || '0');

    // Hàm format số lượng (views, comments, loves)
    const formatCount = useCallback((count: number): string => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    }, []);

    // Fetch manga data by genre
    const fetchMangasByGenre = useCallback(async () => {
        if (!genreName) {
            setError('Tên thể loại không hợp lệ');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Sử dụng mangaService để lấy manga theo thể loại
            const result = await mangaService.findByGenre(genreName, currentPage, pageSize);

            if (!result) {
                throw new Error(`Không thể tải danh sách truyện thể loại ${genreName}`);
            }

            setData(result);
            setTotalPages(result.totalPages);
            setTotalElements(result.totalElements);
        } catch (err) {
            console.error('Error fetching manga by genre:', err);
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải danh sách truyện');
            setData(null);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }, [genreName, currentPage, pageSize]);

    // Load dữ liệu khi component mount hoặc dependencies thay đổi
    useEffect(() => {
        fetchMangasByGenre();
    }, [fetchMangasByGenre]);

    // Hàm xử lý chuyển trang
    const handlePageChange = useCallback((page: number) => {
        setSearchParams({ page: page.toString() });
        // Cuộn lên đầu trang
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [setSearchParams]);

    // Hàm refresh dữ liệu
    const refreshData = useCallback(() => {
        fetchMangasByGenre();
    }, [fetchMangasByGenre]);

    // Computed values
    const mangaList = data?.content || [];
    const hasData = mangaList.length > 0;
    const isEmpty = !loading && !error && !hasData;

    return {
        // Data
        mangaList,
        genreName,

        // Pagination
        currentPage,
        totalPages,
        totalElements,
        pageSize,
        handlePageChange,

        // States
        loading,
        error,
        hasData,
        isEmpty,

        // Actions
        refreshData,

        // Utils
        formatCount
    };
};

export default useGenreDetail;
