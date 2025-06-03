import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import mangaService from '../services/manga-service.js';

export const useLatestUpdates = (pageSize = 20) => {
    const [searchParams, setSearchParams] = useSearchParams();

    // State cho dữ liệu manga
    const [mangaList, setMangaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State cho pagination
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Lấy trang hiện tại từ URL, mặc định là 0 (trang đầu tiên)
    const currentPage = parseInt(searchParams.get('page') || '0');

    // Hàm chuyển đổi trang sang URL
    const handlePageChange = useCallback((page) => {
        setSearchParams({ page: page.toString() });
    }, [setSearchParams]);

    // Hàm format số lượng (views, comments, loves)
    const formatCount = useCallback((count) => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    }, []);

    // Fetch dữ liệu manga mới cập nhật
    const fetchLatestUpdates = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await mangaService.getLatestUpdates(currentPage, pageSize);

            if (result && result.content) {
                // Sử dụng trực tiếp MangaSummaryResponse từ API
                setMangaList(result.content);
                setTotalPages(result.totalPages);
                setTotalElements(result.totalElements);
            } else {
                setError("Không thể tải danh sách truyện mới cập nhật");
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách truyện mới cập nhật:", err);
            setError("Đã xảy ra lỗi khi tải danh sách truyện mới cập nhật");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize]);

    // Load dữ liệu khi component mount hoặc currentPage thay đổi
    useEffect(() => {
        fetchLatestUpdates();
    }, [fetchLatestUpdates]);

    // Hàm refresh dữ liệu
    const refreshData = useCallback(() => {
        fetchLatestUpdates();
    }, [fetchLatestUpdates]);

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
