import { useState, useEffect, useCallback } from 'react';
import mangaService from '../services/manga-service.js';
import userService from '../services/user-service.js';
import statisticsService from '../services/statistics-service.js';

export const useDashboard = () => {
  // State cho thống kê tổng hợp với giá trị mặc định
  const [stats, setStats] = useState({
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
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMangas, setLoadingMangas] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorStats, setErrorStats] = useState(null);
  const [errorMangas, setErrorMangas] = useState(null);
  const [errorUsers, setErrorUsers] = useState(null);

  // State cho dữ liệu từ API
  const [recentMangas, setRecentMangas] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

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
