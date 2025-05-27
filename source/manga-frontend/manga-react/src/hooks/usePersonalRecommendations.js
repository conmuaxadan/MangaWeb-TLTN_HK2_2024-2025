import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import mangaService from '../services/manga-service.js';

export const usePersonalRecommendations = (limit = 6) => {
    const { isLogin, user } = useAuth();

    // State cho dữ liệu
    const [recommendedMangas, setRecommendedMangas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [noRecommendations, setNoRecommendations] = useState(false);

    // Computed state
    const showSection = isLogin && recommendedMangas.length > 0 && !isLoading;

    // Hàm format số lượng (views, comments, loves)
    const formatCount = useCallback((count) => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    }, []);

    // Fetch dữ liệu gợi ý cá nhân
    const fetchRecommendations = useCallback(async () => {
        if (!isLogin || !user) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Sử dụng mangaService để lấy gợi ý cá nhân
            const data = await mangaService.getPersonalRecommendations(limit);

            if (data && data.length > 0) {
                // Sử dụng trực tiếp MangaSummaryResponse từ API
                setRecommendedMangas(data);
                setNoRecommendations(false);
            } else {
                setRecommendedMangas([]);
                setNoRecommendations(true);
            }
        } catch (error) {
            console.error('Lỗi khi tải gợi ý cá nhân:', error);
            setError('Không thể tải gợi ý cá nhân');
            setNoRecommendations(true);
            setRecommendedMangas([]);
        } finally {
            setIsLoading(false);
        }
    }, [isLogin, user, limit]);

    // Load dữ liệu khi component mount hoặc dependencies thay đổi
    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    // Hàm refresh dữ liệu
    const refreshData = useCallback(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    return {
        // Data
        recommendedMangas,

        // States
        isLoading,
        error,
        noRecommendations,
        showSection,

        // Auth states
        isLogin,
        user,

        // Actions
        refreshData,

        // Utils
        formatCount
    };
};

export default usePersonalRecommendations;
