import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import favoriteService from '../services/favorite-service.js';
import { toast } from 'react-toastify';

export const useFavoriteList = (pageSize = 18) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // State cho dữ liệu
    const [favorites, setFavorites] = useState([]);
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

    // Fetch danh sách yêu thích
    const fetchFavorites = useCallback(async () => {
        // Kiểm tra token trong localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const result = await favoriteService.getFavorites(currentPage, pageSize);

            if (!result) {
                throw new Error('Không thể tải danh sách truyện yêu thích');
            }

            setFavorites(result.content || []);
            setTotalPages(result.totalPages);
            setTotalElements(result.totalElements);
        } catch (err) {
            console.error('Lỗi khi tải danh sách yêu thích:', err);
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải danh sách yêu thích');
            setFavorites([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, navigate]);

    // Load dữ liệu khi component mount hoặc dependencies thay đổi
    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    // Hàm xử lý xóa khỏi danh sách yêu thích
    const handleRemoveFavorite = useCallback(async (mangaId) => {
        try {
            const success = await favoriteService.removeFavorite(mangaId);
            if (success) {

                // Cập nhật lại danh sách yêu thích
                const updatedFavorites = favorites.filter(fav => fav.mangaId !== mangaId);
                setFavorites(updatedFavorites);

                // Nếu trang hiện tại không còn item nào và không phải trang đầu tiên
                if (updatedFavorites.length === 0 && currentPage > 0) {
                    // Chuyển về trang trước
                    setSearchParams({ page: (currentPage - 1).toString() });
                } else {
                    // Refresh lại dữ liệu để cập nhật pagination
                    fetchFavorites();
                }
            }
        } catch (error) {
            console.error('Lỗi khi xóa khỏi danh sách yêu thích:', error);
            toast.error('Không thể xóa khỏi danh sách yêu thích', { position: 'top-right' });
        }
    }, [favorites, currentPage, setSearchParams, fetchFavorites]);

    // Hàm xử lý chuyển trang
    const handlePageChange = useCallback((page) => {
        setSearchParams({ page: page.toString() });
        // Cuộn lên đầu trang
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [setSearchParams]);

    // Hàm refresh dữ liệu
    const refreshData = useCallback(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    // Computed values
    const hasData = favorites.length > 0;
    const isEmpty = !loading && !error && !hasData;

    return {
        // Data
        favorites,

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
        handleRemoveFavorite,
        refreshData,

        // Utils
        formatCount
    };
};

export default useFavoriteList;
