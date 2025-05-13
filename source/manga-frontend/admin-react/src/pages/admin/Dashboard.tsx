import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faBook,
  faEye,
  faComment,
  faHeart,
  faChartLine,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import mangaService from '../../services/manga-service';
import userService from '../../services/user-service';
import statisticsService from '../../services/statistics-service';
import { MangaSummaryResponse } from '../../interfaces/models/manga';
import { UserResponse } from '../../interfaces/models/user';

const Dashboard: React.FC = () => {
  // State cho thống kê tổng hợp
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
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  // State cho dữ liệu từ API
  const [recentMangas, setRecentMangas] = useState<MangaSummaryResponse[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserResponse[]>([]);
  const [loadingMangas, setLoadingMangas] = useState<boolean>(true);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [errorMangas, setErrorMangas] = useState<string | null>(null);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  // Lấy dữ liệu từ API khi component được mount
  useEffect(() => {
    const fetchStatistics = async () => {
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
    };

    const fetchRecentMangas = async () => {
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
    };

    const fetchRecentUsers = async () => {
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
    };

    fetchStatistics();
    fetchRecentMangas();
    fetchRecentUsers();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

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
          <>
            <StatsCard
              title="Tổng người dùng"
              value={stats.totalUsers}
              increase={stats.newUsersToday}
              icon={faUsers}
              color="bg-blue-500"
              link="/admin/users"
            />
            <StatsCard
              title="Tổng truyện"
              value={stats.totalMangas}
              increase={stats.newMangasToday}
              icon={faBook}
              color="bg-purple-500"
              link="/admin/mangas"
            />
            <StatsCard
              title="Tổng lượt xem"
              value={stats.totalViews}
              increase={stats.viewsToday}
              icon={faEye}
              color="bg-green-500"
              link="/admin/statistics"
            />
            <StatsCard
              title="Tổng bình luận"
              value={stats.totalComments}
              increase={stats.commentsToday}
              icon={faComment}
              color="bg-yellow-500"
              link="/admin/comments"
            />
            <StatsCard
              title="Tổng yêu thích"
              value={stats.totalFavorites}
              increase={stats.favoritesToday}
              icon={faHeart}
              color="bg-red-500"
              link="/admin/statistics"
            />
          </>
        )}
      </div>

      {/* Recent Data */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Mangas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Truyện mới thêm</h2>
            <Link to="/admin/mangas" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tên truyện
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tác giả
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lượt xem
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ngày thêm
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loadingMangas ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : errorMangas ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-red-500">
                        {errorMangas}
                      </td>
                    </tr>
                  ) : recentMangas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Không có truyện mới nào
                      </td>
                    </tr>
                  ) : (
                    recentMangas.map((manga) => (
                      <tr key={manga.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {manga.title}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {manga.author}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {manga.views ? manga.views.toLocaleString() : '0'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {manga.createdAt ? new Date(manga.createdAt).toLocaleDateString('vi-VN') :
                           manga.updatedAt ? new Date(manga.updatedAt).toLocaleDateString('vi-VN') :
                           manga.lastChapterAddedAt ? new Date(manga.lastChapterAddedAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Người dùng mới</h2>
            <Link to="/admin/users" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tên người dùng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ngày đăng ký
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : errorUsers ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-red-500">
                        {errorUsers}
                      </td>
                    </tr>
                  ) : recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Không có người dùng mới nào
                      </td>
                    </tr>
                  ) : (
                    recentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') :
                           user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('vi-VN') :
                           'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hoạt động gần đây</h2>
        </div>
        <div className="p-6">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
              <p>Biểu đồ hoạt động sẽ được hiển thị ở đây</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: number;
  increase: number;
  icon: any;
  color: string;
  link: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, increase, icon, color, link }) => {
  return (
    <Link to={link} className="block">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${color} text-white mr-4`}>
              <FontAwesomeIcon icon={icon} className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-green-600 dark:text-green-400">
              +{increase} hôm nay
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Dashboard;
