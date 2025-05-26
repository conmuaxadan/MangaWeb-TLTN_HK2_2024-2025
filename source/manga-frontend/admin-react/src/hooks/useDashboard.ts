import { useState, useEffect, useCallback } from 'react';
import mangaService from '../services/manga-service';
import userService from '../services/user-service';
import statisticsService from '../services/statistics-service';
import { MangaSummaryResponse } from '../interfaces/models/manga';
import { UserResponse } from "../interfaces/models/auth";

// Định nghĩa interface cho state thống kê
export interface StatsState {
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

// Interface trả về của hook
interface UseDashboardReturn {
  // States
  stats: StatsState;
  recentMangas: MangaSummaryResponse[];
  recentUsers: UserResponse[];

  // Loading states
  loadingStats: boolean;
  loadingMangas: boolean;
  loadingUsers: boolean;

  // Error states
  errorStats: string | null;
  errorMangas: string | null;
  errorUsers: string | null;

  // Actions
  refreshData: () => Promise<void>;

  // Cấu trúc dữ liệu cho các thẻ thống kê
  statsCards: {
    title: string;
    value: number;
    increase: number;
    icon: any;
    color: string;
    link: string;
  }[];
}

export const useDashboard = (): UseDashboardReturn => {
  // State cho thống kê tổng hợp với giá trị mặc định
  const [stats, setStats] = useState<StatsState>({
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
  });

  // State cho loading và errors
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [loadingMangas, setLoadingMangas] = useState<boolean>(true);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);
  const [errorMangas, setErrorMangas] = useState<string | null>(null);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  // State cho dữ liệu từ API
  const [recentMangas, setRecentMangas] = useState<MangaSummaryResponse[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserResponse[]>([]);

  // Tách các hàm fetch data thành các hàm riêng biệt (sử dụng useCallback để tránh tạo lại hàm)
  const fetchStatistics = useCallback(async () => {
    try {
      setLoadingStats(true);
      const statistics = await statisticsService.getOverviewStatistics();
      if (statistics) {
        setStats(statistics);
        setErrorStats(null);
      } else {
        setErrorStats('Không thể lấy thông tin thống kê');
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin thống kê:', error);
      setErrorStats('Đã xảy ra lỗi khi lấy thông tin thống kê');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchRecentMangas = useCallback(async () => {
    try {
      setLoadingMangas(true);
      // Sử dụng endpoint search với từ khóa rỗng và sắp xếp theo thời gian tạo giảm dần
      const response = await mangaService.searchManga('', 0, 5);
      if (response && response.content) {
        setRecentMangas(response.content);
        setErrorMangas(null);
      } else {
        setErrorMangas('Không thể lấy danh sách truyện mới thêm');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách truyện mới thêm:', error);
      setErrorMangas('Đã xảy ra lỗi khi lấy danh sách truyện mới thêm');
    } finally {
      setLoadingMangas(false);
    }
  }, []);

  const fetchRecentUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const response = await userService.getUsersPaginated(0, 5, 'createdAt,desc');
      if (response && response.content) {
        setRecentUsers(response.content);
        setErrorUsers(null);
      } else {
        setErrorUsers('Không thể lấy danh sách người dùng mới');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng mới:', error);
      setErrorUsers('Đã xảy ra lỗi khi lấy danh sách người dùng mới');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Hàm refresh tất cả dữ liệu - có thể gọi khi cần làm mới dữ liệu
  const refreshData = useCallback(async () => {
    try {
      // Tải song song tất cả dữ liệu để tăng tốc độ tải
      await Promise.all([
        fetchStatistics(),
        fetchRecentMangas(),
        fetchRecentUsers()
      ]);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu dashboard:', error);
    }
  }, [fetchStatistics, fetchRecentMangas, fetchRecentUsers]);

  // Gọi hàm load dữ liệu khi component được mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Tạo mảng dữ liệu thẻ thống kê để render - đưa vào hook để tái sử dụng
  const statsCards = [
    {
      title: "Tổng người dùng",
      value: stats.totalUsers,
      increase: stats.newUsersToday,
      icon: 'faUsers', // Sử dụng string thay vì import trực tiếp icon
      color: "bg-blue-500",
      link: "/admin/users"
    },
    {
      title: "Tổng truyện",
      value: stats.totalMangas,
      increase: stats.newMangasToday,
      icon: 'faBook',
      color: "bg-purple-500",
      link: "/admin/mangas"
    },
    {
      title: "Tổng lượt xem",
      value: stats.totalViews,
      increase: stats.viewsToday,
      icon: 'faEye',
      color: "bg-green-500",
      link: "/admin/statistics"
    },
    {
      title: "Tổng bình luận",
      value: stats.totalComments,
      increase: stats.commentsToday,
      icon: 'faComment',
      color: "bg-yellow-500",
      link: "/admin/comments"
    },
    {
      title: "Tổng yêu thích",
      value: stats.totalFavorites,
      increase: stats.favoritesToday,
      icon: 'faHeart',
      color: "bg-red-500",
      link: "/admin/statistics"
    }
  ];

  // Trả về tất cả states và functions cần thiết
  return {
    // States
    stats,
    recentMangas,
    recentUsers,

    // Loading states
    loadingStats,
    loadingMangas,
    loadingUsers,

    // Error states
    errorStats,
    errorMangas,
    errorUsers,

    // Actions
    refreshData,

    // Config
    statsCards
  };
};

export default useDashboard;
