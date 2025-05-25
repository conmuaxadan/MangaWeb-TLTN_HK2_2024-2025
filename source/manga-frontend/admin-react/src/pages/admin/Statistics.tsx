import React, { useState, useEffect, lazy, Suspense } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faBook,
  faEye,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import statisticsService from '../../services/statistics-service';
import mangaService from '../../services/manga-service';
import userStatisticsService from '../../services/user-statistics-service';
import mangaStatisticsService, { MostViewedMangaResponse } from '../../services/manga-statistics-service';

// Lazy load các component tab để cải thiện hiệu suất khi tải trang
const UsersTab = lazy(() => import('../../components/statistics/UsersTab'));
const MangasTab = lazy(() => import('../../components/statistics/MangasTab'));
const ViewsTab = lazy(() => import('../../components/statistics/ViewsTab'));

// Define interface cho state để tăng tính type-safe
interface StatisticsState {
  mangaStats: {
    totalMangas: number;
    activeMangas: number;
    deletedMangas: number;
    newMangasToday: number;
    mangasByGenre: Record<string, number>;
    mangasByStatus: Record<string, number>;
  };
  overview: {
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
  };
  users: {
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    usersByDay: Array<{ date: string; newUsers: number }>;
    usersByAuthProvider: Array<{ provider: string; count: number }>;
  };
  mangas: {
    totalMangas: number;
    newMangasToday: number;
    ongoingMangas: number;
    completedMangas: number;
    mostViewedMangas: MostViewedMangaResponse[];
  };
  views: {
    totalViews: number;
    viewsToday: number;
    viewsThisWeek: number;
    viewsThisMonth: number;
    viewsByDay: Array<any>;
    viewsByManga: Array<any>;
  };
}

const Statistics: React.FC = () => {
  // State cho tab thống kê
  const [activeTab, setActiveTab] = useState<'users' | 'mangas' | 'views'>('users');

  // State cho trạng thái loading
  const [loading, setLoading] = useState<boolean>(true);

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
      mostViewedMangas: []
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
  const [mangaViewsLimit, setMangaViewsLimit] = useState<5 | 10 | 20>(10);

  // Tách các hàm fetch data thành các hàm riêng biệt để dễ quản lý
  const fetchOverviewStats = async () => {
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
    } catch (error) {
      console.error('Lỗi khi lấy thống kê tổng quan:', error);
    }
  };

  const fetchMangaStatistics = async () => {
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
    } catch (error) {
      console.error('Lỗi khi lấy thống kê chi tiết về truyện:', error);
    }
  };

  const fetchMostViewedMangas = async () => {
    try {
      const mostViewedMangas = await mangaStatisticsService.getMostViewedMangas(5);
      if (mostViewedMangas) {
        setStats(prevStats => ({
          ...prevStats,
          mangas: {
            ...prevStats.mangas,
            mostViewedMangas
          }
        }));
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách truyện được xem nhiều nhất:', error);
    }
  };

  const fetchUserStatistics = async () => {
    try {
      const userStatistics = await userStatisticsService.getUserStatistics();
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
    } catch (error) {
      console.error('Lỗi khi lấy thống kê chi tiết về người dùng:', error);
    }
  };

  // Hàm lấy dữ liệu lượt xem theo ngày với date range
  const fetchViewsByDateRange = async (startDate: string, endDate: string) => {
    try {
      const viewsByDay = await statisticsService.getViewsByDateRange(startDate, endDate);
      // Luôn set data, kể cả khi mảng rỗng để component có thể ẩn biểu đồ
      setStats(prevStats => ({
        ...prevStats,
        views: {
          ...prevStats.views,
          viewsByDay
        }
      }));
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu lượt xem theo ngày:', error);
    }
  };

  // Hàm lấy dữ liệu lượt xem theo truyện với date range
  const fetchViewsByMangaDateRange = async (startDate: string, endDate: string, limit: number) => {
    try {
      const viewsByManga = await statisticsService.getViewsByMangaDateRange(startDate, endDate, limit);
      // Luôn set data, kể cả khi mảng rỗng để component có thể ẩn biểu đồ
      setStats(prevStats => ({
        ...prevStats,
        views: {
          ...prevStats.views,
          viewsByManga
        }
      }));
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu lượt xem theo truyện:', error);
    }
  };

  // Lấy dữ liệu thống kê khi component được mount
  useEffect(() => {
    const fetchAllStatistics = async () => {
      setLoading(true);
      try {
        // Sử dụng Promise.all để đồng thời lấy tất cả dữ liệu
        await Promise.all([
          fetchOverviewStats(),
          fetchMangaStatistics(),
          fetchMostViewedMangas(),
          fetchUserStatistics(),
          fetchViewsByDateRange(startDate, endDate),
          fetchViewsByMangaDateRange(startDate, endDate, mangaViewsLimit)
        ]);
      } catch (error) {
        console.error('Lỗi khi lấy thống kê:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStatistics();
  }, []);

  // Cập nhật dữ liệu lượt xem khi thay đổi date range hoặc manga views limit
  useEffect(() => {
    if (startDate && endDate) {
      fetchViewsByDateRange(startDate, endDate);
      fetchViewsByMangaDateRange(startDate, endDate, mangaViewsLimit);
    }
  }, [startDate, endDate, mangaViewsLimit]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thống kê chi tiết</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === 'users'
                  ? 'text-blue-600 border-b-2 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faUsers} className="mr-2" />
              Người dùng
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('mangas')}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === 'mangas'
                  ? 'text-blue-600 border-b-2 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faBook} className="mr-2" />
              Truyện
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('views')}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === 'views'
                  ? 'text-blue-600 border-b-2 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faEye} className="mr-2" />
              Lượt xem
            </button>
          </li>
        </ul>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
            Đang tải thông tin thống kê...
          </div>
        ) : (
          <Suspense fallback={
            <div className="flex justify-center items-center py-8">
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              Đang tải dữ liệu...
            </div>
          }>
            {/* Users Tab */}
            {activeTab === 'users' && <UsersTab data={stats.users} />}

            {/* Mangas Tab */}
            {activeTab === 'mangas' && <MangasTab mangaStats={stats.mangaStats} mangas={stats.mangas} />}

            {/* Views Tab */}
            {activeTab === 'views' && (
              <ViewsTab
                data={stats.views}
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                mangaViewsLimit={mangaViewsLimit}
                setMangaViewsLimit={setMangaViewsLimit as (value: number) => void}
              />
            )}
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default Statistics;
