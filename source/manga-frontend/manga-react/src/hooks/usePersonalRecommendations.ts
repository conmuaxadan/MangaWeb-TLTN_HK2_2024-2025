import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import mangaService from '../services/manga-service';
import { MangaSummaryResponse } from '../interfaces/models/manga';

export interface PersonalRecommendationData {
    id: string;
    title: string;
    author?: string;
    coverUrl?: string;
    lastChapterNumber?: number;
    lastChapterId?: string;
    lastChapterAddedAt?: string;
    views?: number;
    loves?: number;
    comments?: number;
}

export const usePersonalRecommendations = (limit: number = 6) => {
    const { isLogin, user } = useAuth();
    
    // State cho dữ liệu
    const [recommendedMangas, setRecommendedMangas] = useState<PersonalRecommendationData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [noRecommendations, setNoRecommendations] = useState<boolean>(false);

    // Computed state
    const showSection = isLogin && recommendedMangas.length > 0 && !isLoading;

    // Hàm format số lượng (views, comments, loves)
    const formatCount = useCallback((count: number): string => {
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
            setShowSection(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Sử dụng mangaService để lấy gợi ý cá nhân
            const data = await mangaService.getPersonalRecommendations(limit);
            
            if (data && data.length > 0) {
                // Chuyển đổi dữ liệu từ API sang định dạng phù hợp
                const processedData = data.map((manga: MangaSummaryResponse) => ({
                    id: manga.id,
                    title: manga.title,
                    author: manga.author || 'Không rõ',
                    coverUrl: manga.coverUrl,
                    lastChapterNumber: manga.lastChapterNumber,
                    lastChapterId: manga.lastChapterId,
                    lastChapterAddedAt: manga.lastChapterAddedAt,
                    views: manga.views || 0,
                    loves: manga.loves || 0,
                    comments: manga.comments || 0
                }));

                setRecommendedMangas(processedData);
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
