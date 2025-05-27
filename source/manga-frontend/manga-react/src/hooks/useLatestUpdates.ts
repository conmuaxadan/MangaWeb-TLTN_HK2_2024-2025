import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import mangaService from '../services/manga-service';
import { MangaSummaryResponse } from '../interfaces/models/manga';

export const useLatestUpdates = (pageSize: number = 20) => {
    const [searchParams, setSearchParams] = useSearchParams();

    // State cho dữ liệu manga
    const [mangaList, setMangaList] = useState<MangaSummaryResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State cho pagination
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalElements, setTotalElements] = useState<number>(0);

    // Lấy trang hiện tại từ URL, mặc định là 0 (trang đầu tiên)
    const currentPage = parseInt(searchParams.get('page') || '0');

    // Hàm chuyển đổi trang sang URL
    const handlePageChange = useCallback((page: number) => {
        setSearchParams({ page: page.toString() });
    }, [setSearchParams]);

    // Hàm format số lượng (views, comments, loves)
    const formatCount = useCallback((count: number): string => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    }, []);

    // Fetch dữ liệu manga mới cập nhật
    const fetchMangaSummaries = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await mangaService.getMangaSummaries(currentPage, pageSize, "lastChapterAddedAt,desc");

            if (result && result.content) {
                // Sử dụng trực tiếp MangaSummaryResponse từ API
                setMangaList(result.content);
                setTotalPages(result.totalPages);
                setTotalElements(result.totalElements);
            } else {
                setError("Không thể tải danh sách manga");
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách manga:", err);
            setError("Đã xảy ra lỗi khi tải danh sách manga");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize]);

    // Load dữ liệu khi component mount hoặc currentPage thay đổi
    useEffect(() => {
        fetchMangaSummaries();
    }, [fetchMangaSummaries]);

    // Hàm refresh dữ liệu
    const refreshData = useCallback(() => {
        fetchMangaSummaries();
    }, [fetchMangaSummaries]);

    return {
        // Data
        mangaList,

        // Pagination
        currentPage,
        totalPages,
        totalElements,
        pageSize,
        handlePageChange,

        // States
        loading,
        error,

        // Actions
        refreshData,

        // Utils
        formatCount
    };
};

export default useLatestUpdates;
