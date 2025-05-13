import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faBook,
  faEye,
  faComment,
  faHeart,
  faChartLine,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';

const Statistics: React.FC = () => {
  // State cho tab thống kê
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'mangas' | 'views'>('overview');

  // Dữ liệu mẫu cho thống kê
  const stats = {
    overview: {
      totalUsers: 1250,
      totalMangas: 450,
      totalViews: 1250000,
      totalComments: 8750,
      totalFavorites: 15600,
      newUsersToday: 25,
      newMangasToday: 5,
      viewsToday: 12500,
      commentsToday: 120,
      favoritesToday: 230
    },
    users: {
      totalUsers: 1250,
      newUsersToday: 25,
      newUsersThisWeek: 120,
      newUsersThisMonth: 480,
      usersByDay: [
        { date: '2023-05-01', newUsers: 20 },
        { date: '2023-05-02', newUsers: 25 },
        { date: '2023-05-03', newUsers: 18 },
        { date: '2023-05-04', newUsers: 22 },
        { date: '2023-05-05', newUsers: 30 },
        { date: '2023-05-06', newUsers: 28 },
        { date: '2023-05-07', newUsers: 25 }
      ],
      usersByAuthProvider: [
        { provider: 'LOCAL', count: 850 },
        { provider: 'GOOGLE', count: 400 }
      ]
    },
    mangas: {
      totalMangas: 450,
      newMangasToday: 5,
      newMangasThisWeek: 20,
      newMangasThisMonth: 80,
      mangasByDay: [
        { date: '2023-05-01', newMangas: 3 },
        { date: '2023-05-02', newMangas: 5 },
        { date: '2023-05-03', newMangas: 2 },
        { date: '2023-05-04', newMangas: 4 },
        { date: '2023-05-05', newMangas: 6 },
        { date: '2023-05-06', newMangas: 3 },
        { date: '2023-05-07', newMangas: 5 }
      ],
      mangasByGenre: [
        { genre: 'Action', count: 120 },
        { genre: 'Adventure', count: 100 },
        { genre: 'Comedy', count: 80 },
        { genre: 'Drama', count: 70 },
        { genre: 'Fantasy', count: 90 },
        { genre: 'Romance', count: 60 }
      ],
      mangasByStatus: [
        { status: 'ONGOING', count: 250 },
        { status: 'COMPLETED', count: 180 },
        { status: 'PAUSED', count: 20 }
      ],
      mostViewedMangas: [
        { id: '1', title: 'One Piece', views: 50000 },
        { id: '2', title: 'Naruto', views: 45000 },
        { id: '3', title: 'Bleach', views: 40000 },
        { id: '4', title: 'Dragon Ball', views: 38000 },
        { id: '5', title: 'Attack on Titan', views: 35000 }
      ]
    },
    views: {
      totalViews: 1250000,
      viewsToday: 12500,
      viewsThisWeek: 87500,
      viewsThisMonth: 350000,
      viewsByDay: [
        { date: '2023-05-01', views: 10000 },
        { date: '2023-05-02', views: 12500 },
        { date: '2023-05-03', views: 11000 },
        { date: '2023-05-04', views: 13000 },
        { date: '2023-05-05', views: 15000 },
        { date: '2023-05-06', views: 14000 },
        { date: '2023-05-07', views: 12500 }
      ]
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thống kê chi tiết</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faChartLine} className="mr-2" />
              Tổng quan
            </button>
          </li>
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-6">
              <StatsCard
                title="Tổng người dùng"
                value={stats.overview.totalUsers}
                increase={stats.overview.newUsersToday}
                icon={faUsers}
                color="bg-blue-500"
              />
              <StatsCard
                title="Tổng truyện"
                value={stats.overview.totalMangas}
                increase={stats.overview.newMangasToday}
                icon={faBook}
                color="bg-purple-500"
              />
              <StatsCard
                title="Tổng lượt xem"
                value={stats.overview.totalViews}
                increase={stats.overview.viewsToday}
                icon={faEye}
                color="bg-green-500"
              />
              <StatsCard
                title="Tổng bình luận"
                value={stats.overview.totalComments}
                increase={stats.overview.commentsToday}
                icon={faComment}
                color="bg-yellow-500"
              />
              <StatsCard
                title="Tổng yêu thích"
                value={stats.overview.totalFavorites}
                increase={stats.overview.favoritesToday}
                icon={faHeart}
                color="bg-red-500"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Biểu đồ hoạt động</h2>
              <div className="h-80 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
                  <p>Biểu đồ hoạt động sẽ được hiển thị ở đây</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <StatsCard
                title="Tổng người dùng"
                value={stats.users.totalUsers}
                icon={faUsers}
                color="bg-blue-500"
              />
              <StatsCard
                title="Người dùng mới hôm nay"
                value={stats.users.newUsersToday}
                icon={faUsers}
                color="bg-green-500"
              />
              <StatsCard
                title="Người dùng mới tuần này"
                value={stats.users.newUsersThisWeek}
                icon={faUsers}
                color="bg-purple-500"
              />
              <StatsCard
                title="Người dùng mới tháng này"
                value={stats.users.newUsersThisMonth}
                icon={faUsers}
                color="bg-yellow-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Người dùng mới theo ngày</h2>
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
                    <p>Biểu đồ người dùng mới theo ngày sẽ được hiển thị ở đây</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Người dùng theo nhà cung cấp</h2>
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
                    <p>Biểu đồ người dùng theo nhà cung cấp sẽ được hiển thị ở đây</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mangas Tab */}
        {activeTab === 'mangas' && (
          <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <StatsCard
                title="Tổng truyện"
                value={stats.mangas.totalMangas}
                icon={faBook}
                color="bg-purple-500"
              />
              <StatsCard
                title="Truyện mới hôm nay"
                value={stats.mangas.newMangasToday}
                icon={faBook}
                color="bg-green-500"
              />
              <StatsCard
                title="Truyện mới tuần này"
                value={stats.mangas.newMangasThisWeek}
                icon={faBook}
                color="bg-blue-500"
              />
              <StatsCard
                title="Truyện mới tháng này"
                value={stats.mangas.newMangasThisMonth}
                icon={faBook}
                color="bg-yellow-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Truyện theo thể loại</h2>
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
                    <p>Biểu đồ truyện theo thể loại sẽ được hiển thị ở đây</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Truyện theo trạng thái</h2>
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
                    <p>Biểu đồ truyện theo trạng thái sẽ được hiển thị ở đây</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Truyện được xem nhiều nhất</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tên truyện
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Lượt xem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.mangas.mostViewedMangas.map((manga) => (
                      <tr key={manga.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {manga.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {manga.views.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Views Tab */}
        {activeTab === 'views' && (
          <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <StatsCard
                title="Tổng lượt xem"
                value={stats.views.totalViews}
                icon={faEye}
                color="bg-green-500"
              />
              <StatsCard
                title="Lượt xem hôm nay"
                value={stats.views.viewsToday}
                icon={faEye}
                color="bg-blue-500"
              />
              <StatsCard
                title="Lượt xem tuần này"
                value={stats.views.viewsThisWeek}
                icon={faEye}
                color="bg-purple-500"
              />
              <StatsCard
                title="Lượt xem tháng này"
                value={stats.views.viewsThisMonth}
                icon={faEye}
                color="bg-yellow-500"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lượt xem theo ngày</h2>
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-500 dark:text-gray-400" />
                  <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                    <option value="7">7 ngày qua</option>
                    <option value="30">30 ngày qua</option>
                    <option value="90">90 ngày qua</option>
                  </select>
                </div>
              </div>
              <div className="h-80 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
                  <p>Biểu đồ lượt xem theo ngày sẽ được hiển thị ở đây</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: number;
  increase?: number;
  icon: any;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, increase, icon, color }) => {
  return (
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
        {increase !== undefined && (
          <div className="mt-4">
            <div className="text-sm text-green-600 dark:text-green-400">
              +{increase} hôm nay
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
