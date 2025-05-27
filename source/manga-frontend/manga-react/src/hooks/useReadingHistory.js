import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import historyService from '../services/history-service.js';

export const useReadingHistory = (pageSize = 18) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // State cho dữ liệu
    const [readingHistory, setReadingHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State cho pagination
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Lấy trang hiện tại từ URL, mặc định là 0 (trang đầu tiên)
    const currentPage = parseInt(searchParams.get('page') || '0');

    // Hàm format số lượng (views, comments, loves)
    const formatCount = useCallback((count) => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    }, []);

    // Fetch lịch sử đọc
    const fetchReadingHistory = useCallback(async () => {
        // Kiểm tra token trong localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const result = await historyService.getMyReadingHistory(currentPage, pageSize);

            if (!result) {
                throw new Error('Không thể tải lịch sử đọc truyện');
            }

            setReadingHistory(result.content || []);
            setTotalPages(result.totalPages);
            setTotalElements(result.totalElements);
        } catch (err) {
            console.error('Lỗi khi tải lịch sử đọc:', err);
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải lịch sử đọc');
            setReadingHistory([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, navigate]);

    // Load dữ liệu khi component mount hoặc dependencies thay đổi
    useEffect(() => {
        fetchReadingHistory();
    }, [fetchReadingHistory]);

    // Hàm xử lý chuyển trang
    const handlePageChange = useCallback((page) => {
        setSearchParams({ page: page.toString() });
        // Cuộn lên đầu trang
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [setSearchParams]);

    // Hàm refresh dữ liệu
    const refreshData = useCallback(() => {
        fetchReadingHistory();
    }, [fetchReadingHistory]);

    // Computed values
    const hasData = readingHistory.length > 0;
    const isEmpty = !loading && !error && !hasData;

    return {
        // Data
        readingHistory,

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

export default useReadingHistory;
