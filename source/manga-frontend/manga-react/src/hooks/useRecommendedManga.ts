import { useState, useEffect, useCallback } from 'react';
import mangaService from '../services/manga-service';

export interface RecommendedMangaData {
    id: string;
    title: string;
    coverUrl?: string;
    author?: string;
    lastChapterAddedAt?: string;
    lastChapterNumber?: number;
    lastChapterId?: string;
    views?: number;
    loves?: number;
    comments?: number;
}

export const useRecommendedManga = (limit: number = 10) => {
    // State cho dữ liệu manga
    const [recommendedManga, setRecommendedManga] = useState<RecommendedMangaData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch dữ liệu manga đề cử
    const fetchRecommendedManga = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Lấy manga đề cử (có thể thay đổi logic tùy theo yêu cầu)
            const result = await mangaService.getMangaSummaries(0, limit, "createdAt,desc");

            if (result && result.content) {
                // Đảm bảo có đầy đủ thông tin cho mỗi manga
                const mangaWithDetails = result.content.map(manga => ({
                    ...manga,
                    lastChapterNumber: manga.lastChapterNumber || 0,
                    views: manga.views || 0,
                    loves: manga.loves || 0,
                    comments: manga.comments || 0,
                    author: manga.author || 'Không rõ'
                }));
                setRecommendedManga(mangaWithDetails);
            } else {
                setError('Không thể tải dữ liệu truyện đề cử');
            }
        } catch (error) {
            console.error('Lỗi khi tải truyện đề cử:', error);
            setError('Đã xảy ra lỗi khi tải truyện đề cử');
        } finally {
            setLoading(false);
        }
    }, [limit]);

    // Load dữ liệu khi component mount
    useEffect(() => {
        fetchRecommendedManga();
    }, [fetchRecommendedManga]);

    // Hàm refresh dữ liệu
    const refreshData = useCallback(() => {
        fetchRecommendedManga();
    }, [fetchRecommendedManga]);

    // Hàm format số lượng (views, comments, loves)
    const formatCount = useCallback((count: number): string => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    }, []);

    return {
        // Data
        recommendedManga,
        
        // States
        loading,
        error,
        
        // Actions
        refreshData,
        
        // Utils
        formatCount
    };
};

export default useRecommendedManga;
