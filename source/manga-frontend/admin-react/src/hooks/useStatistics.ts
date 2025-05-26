import { useState, useEffect, useCallback } from 'react';
import statisticsService from '../services/statistics-service';
import mangaService from '../services/manga-service';
import userService from "../services/user-service.ts";

// Define interfaces cho state để tăng tính type-safe
export interface MangaStats {
  totalMangas: number;
  activeMangas: number;
  deletedMangas: number;
  newMangasToday: number;
  mangasByGenre: Record<string, number>;
  mangasByStatus: Record<string, number>;
}

export interface OverviewStats {
  totalUsers: number;
  totalMangas: number;
  totalViews: number;
  totalComments: number;
  totalFavorites: number;
  newUsersToday: number;
  newMangasToday: number;
  viewsToday: number;
  commentsToday: number;
  favoritesToday: number;
}

export interface UsersStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByDay: Array<{ date: string; newUsers: number }>;
  usersByAuthProvider: Array<{ provider: string; count: number }>;
}

export interface MangasStats {
  totalMangas: number;
  newMangasToday: number;
  ongoingMangas: number;
  completedMangas: number;
}

export interface ViewsStats {
  totalViews: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  viewsByDay: Array<any>;
  viewsByManga: Array<any>;
}

export interface StatisticsState {
  mangaStats: MangaStats;
  overview: OverviewStats;
  users: UsersStats;
  mangas: MangasStats;
  views: ViewsStats;
}

// Định nghĩa kiểu dữ liệu trả về của hook
interface UseStatisticsReturn {
  // State
  activeTab: 'users' | 'mangas' | 'views';
  startDate: string;
  endDate: string;
  mangaViewsLimit: number;
  stats: StatisticsState;
  loading: boolean;

  // Actions
  setActiveTab: (tab: 'users' | 'mangas' | 'views') => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setMangaViewsLimit: (limit: number) => void;
  refreshData: () => Promise<void>;
}

export const useStatistics = (): UseStatisticsReturn => {
  // State cho tab thống kê
  const [activeTab, setActiveTab] = useState<'users' | 'mangas' | 'views'>('users');

  // State cho trạng thái loading
  const [loading, setLoading] = useState<boolean>(true);

  // State cho khoảng thời gian hiển thị lượt xem
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDayOfMonth.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  // State cho số lượng truyện hiển thị trong biểu đồ lượt xem theo truyện
  const [mangaViewsLimit, setMangaViewsLimit] = useState<number>(10);

  // State cho dữ liệu thống kê
  const [stats, setStats] = useState<StatisticsState>({
    mangaStats: {
      totalMangas: 0,
      activeMangas: 0,
      deletedMangas: 0,
      newMangasToday: 0,
      mangasByGenre: {},
      mangasByStatus: {}
    },
    overview: {
      totalUsers: 0,
      totalMangas: 0,
      totalViews: 0,
      totalComments: 0,
      totalFavorites: 0,
      newUsersToday: 0,
      newMangasToday: 0,
      viewsToday: 0,
      commentsToday: 0,
      favoritesToday: 0
    },
    users: {
      totalUsers: 0,
      newUsersToday: 0,
      newUsersThisWeek: 0,
      newUsersThisMonth: 0,
      usersByDay: [],
      usersByAuthProvider: []
    },
    mangas: {
      totalMangas: 0,
      newMangasToday: 0,
      ongoingMangas: 0,
      completedMangas: 0,
    },
    views: {
      totalViews: 0,
      viewsToday: 0,
      viewsThisWeek: 0,
      viewsThisMonth: 0,
      viewsByDay: [],
      viewsByManga: []
    }
  });

  // Tách các hàm fetch data thành các hàm riêng biệt để dễ quản lý
  const fetchOverviewStats = useCallback(async () => {
    try {
      const overviewStats = await statisticsService.getOverviewStatistics();
      if (overviewStats) {
        setStats(prevStats => ({
          ...prevStats,
          overview: {
            ...prevStats.overview,
            ...overviewStats
          },
          views: {
            ...prevStats.views,
            totalViews: overviewStats.totalViews,
            viewsToday: overviewStats.viewsToday,
            viewsThisWeek: overviewStats.viewsThisWeek || 0,
            viewsThisMonth: overviewStats.viewsThisMonth || 0
          }
        }));
      }
      return overviewStats;
    } catch (error) {
      console.error('Lỗi khi lấy thống kê tổng quan:', error);
      return null;
    }
  }, []);

  const fetchMangaStatistics = useCallback(async () => {
    try {
      const mangaStatistics = await mangaService.getMangaStatistics();
      if (mangaStatistics) {
        // Tính toán số truyện theo trạng thái
        const ongoingMangas = mangaStatistics.mangasByStatus['ONGOING'] || 0;
        const completedMangas = mangaStatistics.mangasByStatus['COMPLETED'] || 0;

        setStats(prevStats => ({
          ...prevStats,
          mangaStats: mangaStatistics,
          mangas: {
            ...prevStats.mangas,
            totalMangas: mangaStatistics.activeMangas,
            newMangasToday: mangaStatistics.newMangasToday,
            ongoingMangas,
            completedMangas
          }
        }));
      }
      return mangaStatistics;
    } catch (error) {
      console.error('Lỗi khi lấy thống kê chi tiết về truyện:', error);
      return null;
    }
  }, []);

  const fetchUserStatistics = useCallback(async () => {
    try {
      const userStatistics = await userService.getUserStatistics();
      if (userStatistics) {
        // Chuyển đổi usersByAuthProvider từ Record<string, number> sang mảng đối tượng
        const usersByAuthProviderArray = Object.entries(userStatistics.usersByAuthProvider).map(([provider, count]) => ({
          provider,
          count
        }));

        // Chuyển đổi usersByDay từ Record<string, number> sang mảng đối tượng
        const usersByDayArray = Object.entries(userStatistics.usersByDay)
          .map(([date, newUsers]) => ({ date, newUsers }))
          .sort((a, b) => a.date.localeCompare(b.date)); // Sắp xếp theo ngày

        setStats(prevStats => ({
          ...prevStats,
          users: {
            ...prevStats.users,
            totalUsers: userStatistics.totalUsers,
            newUsersToday: userStatistics.newUsersToday,
            newUsersThisWeek: userStatistics.newUsersThisWeek,
            newUsersThisMonth: userStatistics.newUsersThisMonth,
            usersByDay: usersByDayArray,
            usersByAuthProvider: usersByAuthProviderArray
          }
        }));
      }
      return userStatistics;
    } catch (error) {
      console.error('Lỗi khi lấy thống kê chi tiết về người dùng:', error);
      return null;
    }
  }, []);

  // Hàm lấy dữ liệu lượt xem theo ngày với date range
  const fetchViewsByDateRange = useCallback(async (start: string, end: string) => {
    try {
      const viewsByDay = await statisticsService.getViewsByDateRange(start, end);
      // Luôn set data, kể cả khi mảng rỗng để component có thể ẩn biểu đồ
      setStats(prevStats => ({
        ...prevStats,
        views: {
          ...prevStats.views,
          viewsByDay
        }
      }));
      return viewsByDay;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu lượt xem theo ngày:', error);
      return [];
    }
  }, []);

  // Hàm lấy dữ liệu lượt xem theo truyện với date range
  const fetchViewsByMangaDateRange = useCallback(async (start: string, end: string, limit: number) => {
    try {
      const viewsByManga = await statisticsService.getViewsByMangaDateRange(start, end, limit);
      // Luôn set data, kể cả khi mảng rỗng để component có thể ẩn biểu đồ
      setStats(prevStats => ({
        ...prevStats,
        views: {
          ...prevStats.views,
          viewsByManga
        }
      }));
      return viewsByManga;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu lượt xem theo truyện:', error);
      return [];
    }
  }, []);

  // Hàm tổng hợp để làm mới tất cả dữ liệu
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // Sử dụng Promise.all để đồng thời lấy tất cả dữ liệu
      await Promise.all([
        fetchOverviewStats(),
        fetchMangaStatistics(),
        fetchUserStatistics(),
        fetchViewsByDateRange(startDate, endDate),
        fetchViewsByMangaDateRange(startDate, endDate, mangaViewsLimit)
      ]);
    } catch (error) {
      console.error('Lỗi khi lấy thống kê:', error);
    } finally {
      setLoading(false);
    }
  }, [
    fetchOverviewStats,
    fetchMangaStatistics,
    fetchUserStatistics,
    fetchViewsByDateRange,
    fetchViewsByMangaDateRange,
    startDate,
    endDate,
    mangaViewsLimit
  ]);

  // Lấy dữ liệu thống kê khi component được mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Cập nhật dữ liệu lượt xem khi thay đổi date range hoặc manga views limit
  useEffect(() => {
    if (startDate && endDate) {
      fetchViewsByDateRange(startDate, endDate);
      fetchViewsByMangaDateRange(startDate, endDate, mangaViewsLimit);
    }
  }, [startDate, endDate, mangaViewsLimit, fetchViewsByDateRange, fetchViewsByMangaDateRange]);

  // Handler để thay đổi giới hạn hiển thị truyện
  const handleSetMangaViewsLimit = useCallback((limit: number) => {
    setMangaViewsLimit(limit);
  }, []);

  return {
    // States
    activeTab,
    startDate,
    endDate,
    mangaViewsLimit,
    stats,
    loading,

    // Actions
    setActiveTab,
    setStartDate,
    setEndDate,
    setMangaViewsLimit: handleSetMangaViewsLimit,
    refreshData
  };
};

export default useStatistics;
