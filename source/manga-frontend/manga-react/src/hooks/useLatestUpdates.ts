import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import mangaService from '../services/manga-service';

export interface LatestUpdateMangaData {
    id: string;
    title: string;
    author: string;
    image: string;
    chapter: string;
    timeAgo: string;
    link: string;
    chapterLink: string;
    views: number;
    loves: number;
    comments: number;
    lastChapterId?: string;
}

export const useLatestUpdates = (pageSize: number = 20) => {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // State cho dữ liệu manga
    const [mangaList, setMangaList] = useState<LatestUpdateMangaData[]>([]);
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
                // Chuyển đổi dữ liệu từ API sang định dạng phù hợp
                const processedData = result.content.map(manga => ({
                    id: manga.id,
                    title: manga.title,
                    author: manga.author || 'Không rõ',
                    image: manga.coverUrl || '/images/default-manga-cover.jpg',
                    chapter: manga.lastChapterNumber ? `C. ${manga.lastChapterNumber}` : 'Chưa có chapter',
                    timeAgo: manga.lastChapterAddedAt
                        ? formatDistanceToNow(new Date(manga.lastChapterAddedAt), { addSuffix: true, locale: vi })
                        : 'Chưa cập nhật',
                    link: `/mangas/${manga.id}`,
                    chapterLink: manga.lastChapterId
                        ? `/mangas/${manga.id}/chapters/${manga.lastChapterId}`
                        : `/mangas/${manga.id}`,
                    views: manga.views || 0,
                    loves: manga.loves || 0,
                    comments: manga.comments || 0,
                    lastChapterId: manga.lastChapterId
                }));

                setMangaList(processedData);
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
