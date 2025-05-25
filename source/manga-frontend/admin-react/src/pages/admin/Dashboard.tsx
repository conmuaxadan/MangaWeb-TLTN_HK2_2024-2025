import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faBook,
  faEye,
  faComment,
  faHeart,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import mangaService from '../../services/manga-service';
import userService from '../../services/user-service';
import statisticsService from '../../services/statistics-service';
import { MangaSummaryResponse } from '../../interfaces/models/manga';
import { UserResponse } from "../../interfaces/models/auth";
import StatsCard from '../../components/dashboard/StatsCard';
import RecentMangasTable from '../../components/dashboard/RecentMangasTable';
import RecentUsersTable from '../../components/dashboard/RecentUsersTable';

// Định nghĩa interface cho state thống kê
interface StatsState {
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

const Dashboard: React.FC = () => {
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
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  // State cho dữ liệu từ API
  const [recentMangas, setRecentMangas] = useState<MangaSummaryResponse[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserResponse[]>([]);
  const [loadingMangas, setLoadingMangas] = useState<boolean>(true);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [errorMangas, setErrorMangas] = useState<string | null>(null);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

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

  // Sử dụng Promise.all để tải song song tất cả dữ liệu
  useEffect(() => {
    const loadAllData = async () => {
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
    };

    loadAllData();
  }, [fetchStatistics, fetchRecentMangas, fetchRecentUsers]);

  // Tạo mảng dữ liệu thẻ thống kê để render
  const statsCards = [
    {
      title: "Tổng người dùng",
      value: stats.totalUsers,
      increase: stats.newUsersToday,
      icon: faUsers,
      color: "bg-blue-500",
      link: "/admin/users"
    },
    {
      title: "Tổng truyện",
      value: stats.totalMangas,
      increase: stats.newMangasToday,
      icon: faBook,
      color: "bg-purple-500",
      link: "/admin/mangas"
    },
    {
      title: "Tổng lượt xem",
      value: stats.totalViews,
      increase: stats.viewsToday,
      icon: faEye,
      color: "bg-green-500",
      link: "/admin/statistics"
    },
    {
      title: "Tổng bình luận",
      value: stats.totalComments,
      increase: stats.commentsToday,
      icon: faComment,
      color: "bg-yellow-500",
      link: "/admin/comments"
    },
    {
      title: "Tổng yêu thích",
      value: stats.totalFavorites,
      increase: stats.favoritesToday,
      icon: faHeart,
      color: "bg-red-500",
      link: "/admin/statistics"
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tổng quan</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {loadingStats ? (
          <div className="col-span-5 flex justify-center items-center py-8">
            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
            Đang tải thông tin thống kê...
          </div>
        ) : errorStats ? (
          <div className="col-span-5 text-center text-red-500 py-8">
            {errorStats}
          </div>
        ) : (
          statsCards.map((card, index) => (
            <StatsCard
              key={index}
              title={card.title}
              value={card.value}
              increase={card.increase}
              icon={card.icon}
              color={card.color}
              link={card.link}
            />
          ))
        )}
      </div>

      {/* Recent Data */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Mangas Table Component */}
        <RecentMangasTable
          loading={loadingMangas}
          error={errorMangas}
          mangas={recentMangas}
        />

        {/* Recent Users Table Component */}
        <RecentUsersTable
          loading={loadingUsers}
          error={errorUsers}
          users={recentUsers}
        />
      </div>
    </div>
  );
};

export default Dashboard;
