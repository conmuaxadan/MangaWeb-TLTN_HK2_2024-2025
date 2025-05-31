import { useState, useEffect, useCallback } from 'react';
import mangaService from '../services/manga-service.js';
import { faEye, faHeart, faClock } from '@fortawesome/free-solid-svg-icons';

export const useTopManga = () => {
    // State cho dữ liệu manga
    const [topViewMangas, setTopViewMangas] = useState([]);
    const [topLoveMangas, setTopLoveMangas] = useState([]);
    const [newMangas, setNewMangas] = useState([]);

    // State cho UI
    const [activeTab, setActiveTab] = useState('top');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Các icon FontAwesome
    const icons = {
        view: faEye,
        love: faHeart,
        new: faClock
    };

    // Fetch tất cả dữ liệu ranking
    const fetchAllRankings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch song song để tối ưu performance
            const [topViewsResult, topLovesResult, newMangasResult] = await Promise.all([
                mangaService.getMangaSummaries(0, 5, "views,desc"),
                mangaService.getMangaSummaries(0, 5, "loves,desc"),
                mangaService.getMangaSummaries(0, 5, "createdAt,desc")
            ]);

            // Cập nhật state
            if (topViewsResult) {
                setTopViewMangas(topViewsResult.content);
            }
            if (topLovesResult) {
                setTopLoveMangas(topLovesResult.content);
            }
            if (newMangasResult) {
                setNewMangas(newMangasResult.content);
            }

        } catch (error) {
            console.error('Lỗi khi tải bảng xếp hạng:', error);
            setError('Không thể tải dữ liệu bảng xếp hạng');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load dữ liệu khi component mount
    useEffect(() => {
        fetchAllRankings();
    }, [fetchAllRankings]);

    // Lấy thông tin tab đang active
    const getActiveTabData = useCallback(() => {
        switch (activeTab) {
            case 'top':
                return {
                    data: topViewMangas,
                    icon: icons.view,
                    title: "Top lượt xem",
                    statIcon: icons.view,
                    statValue: (manga) => `${manga.views?.toLocaleString() || 0} lượt xem`
                };
            case 'favorite':
                return {
                    data: topLoveMangas,
                    icon: icons.love,
                    title: "Top yêu thích",
                    statIcon: icons.love,
                    statValue: (manga) => `${manga.loves?.toLocaleString() || 0} lượt thích`
                };
            case 'new':
                return {
                    data: newMangas,
                    icon: icons.new,
                    title: "Truyện mới",
                    statIcon: null,
                    statValue: () => "Mới nhất"
                };
            default:
                return {
                    data: topViewMangas,
                    icon: icons.view,
                    title: "Top lượt xem",
                    statIcon: icons.view,
                    statValue: (manga) => `${manga.views?.toLocaleString() || 0} lượt xem`
                };
        }
    }, [activeTab, topViewMangas, topLoveMangas, newMangas, icons]);

    // Hàm refresh dữ liệu
    const refreshData = useCallback(() => {
        fetchAllRankings();
    }, [fetchAllRankings]);

    return {
        // Data
        topViewMangas,
        topLoveMangas,
        newMangas,

        // UI State
        activeTab,
        setActiveTab,
        loading,
        error,

        // Computed data
        activeTabInfo: getActiveTabData(),

        // Icons
        icons,

        // Actions
        refreshData
    };
};

export default useTopManga;
