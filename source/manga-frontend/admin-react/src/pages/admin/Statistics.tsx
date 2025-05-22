import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faBook,
  faEye,
  faComment,
  faHeart,
  faChartLine,
  faCalendarAlt,
  faSpinner,
  faTrash,
  faCheckCircle,
  faUser as faUserAlt
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import statisticsService from '../../services/statistics-service';
import mangaService from '../../services/manga-service';
import userStatisticsService from '../../services/user-statistics-service';
import mangaStatisticsService from '../../services/manga-statistics-service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const Statistics: React.FC = () => {
  // State cho tab thống kê
  const [activeTab, setActiveTab] = useState<'users' | 'mangas' | 'views'>('users');

  // State cho trạng thái loading
  const [loading, setLoading] = useState<boolean>(true);

  // State cho dữ liệu thống kê
  const [stats, setStats] = useState({
    // State cho thống kê chi tiết về truyện
    mangaStats: {
      totalMangas: 0,
      activeMangas: 0,
      deletedMangas: 0,
      newMangasToday: 0,
      mangasByGenre: {} as Record<string, number>,
      mangasByStatus: {} as Record<string, number>
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
  const [viewsTimeRange, setViewsTimeRange] = useState<7 | 30 | 90>(7);

  // State cho số lượng truyện hiển thị trong biểu đồ lượt xem theo truyện
  const [mangaViewsLimit, setMangaViewsLimit] = useState<5 | 10 | 20>(10);

  // Lấy dữ liệu thống kê khi component được mount
  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        // Lấy thống kê tổng quan
        const overviewStats = await statisticsService.getOverviewStatistics();
        if (overviewStats) {
          setStats(prevStats => ({
            ...prevStats,
            overview: {
              ...prevStats.overview,
              totalUsers: overviewStats.totalUsers,
              totalMangas: overviewStats.totalMangas,
              totalViews: overviewStats.totalViews,
              totalComments: overviewStats.totalComments,
              totalFavorites: overviewStats.totalFavorites,
              newUsersToday: overviewStats.newUsersToday,
              newMangasToday: overviewStats.newMangasToday,
              viewsToday: overviewStats.viewsToday,
              commentsToday: overviewStats.commentsToday,
              favoritesToday: overviewStats.favoritesToday
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

        // Lấy thống kê chi tiết về truyện
        const mangaStatistics = await mangaService.getMangaStatistics();
        if (mangaStatistics) {
          console.log('MangaStatistics:', mangaStatistics);
          console.log('MangasByStatus:', mangaStatistics.mangasByStatus);

          // Tính toán số truyện theo trạng thái
          const ongoingMangas = mangaStatistics.mangasByStatus['ONGOING'] || 0;
          const completedMangas = mangaStatistics.mangasByStatus['COMPLETED'] || 0;

          console.log('OngoingMangas:', ongoingMangas);
          console.log('CompletedMangas:', completedMangas);

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

        // Lấy danh sách truyện được xem nhiều nhất
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

        // Lấy thống kê chi tiết về người dùng
        const userStatistics = await userStatisticsService.getUserStatistics();
        if (userStatistics) {
          // Chuyển đổi usersByAuthProvider từ Record<string, number> sang mảng đối tượng
          const usersByAuthProviderArray = Object.entries(userStatistics.usersByAuthProvider).map(([provider, count]) => ({
            provider,
            count
          }));

          // Chuyển đổi usersByDay từ Record<string, number> sang mảng đối tượng
          const usersByDayArray = Object.entries(userStatistics.usersByDay).map(([date, newUsers]) => ({
            date,
            newUsers
          }));

          // Sắp xếp usersByDay theo ngày
          usersByDayArray.sort((a, b) => a.date.localeCompare(b.date));

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

        // Lấy dữ liệu lượt xem theo ngày
        await fetchViewsByDay(viewsTimeRange);

        // Lấy dữ liệu lượt xem theo truyện
        await fetchViewsByManga(viewsTimeRange, mangaViewsLimit);
      } catch (error) {
        console.error('Lỗi khi lấy thống kê:', error);
      } finally {
        setLoading(false);
      }
    };

    // Hàm lấy dữ liệu lượt xem theo ngày
    const fetchViewsByDay = async (days: number) => {
      try {
        const viewsByDay = await statisticsService.getViewsByDay(days);
        if (viewsByDay && viewsByDay.length > 0) {
          setStats(prevStats => ({
            ...prevStats,
            views: {
              ...prevStats.views,
              viewsByDay
            }
          }));
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu lượt xem theo ngày:', error);
      }
    };

    // Hàm lấy dữ liệu lượt xem theo truyện
    const fetchViewsByManga = async (days: number, limit: number) => {
      try {
        const viewsByManga = await statisticsService.getViewsByManga(days, limit);
        if (viewsByManga && viewsByManga.length > 0) {
          setStats(prevStats => ({
            ...prevStats,
            views: {
              ...prevStats.views,
              viewsByManga
            }
          }));
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu lượt xem theo truyện:', error);
      }
    };

    fetchStatistics();
  }, []);

  // Cập nhật dữ liệu lượt xem theo ngày khi thay đổi khoảng thời gian
  useEffect(() => {
    const fetchViewsByDay = async () => {
      try {
        const viewsByDay = await statisticsService.getViewsByDay(viewsTimeRange);
        if (viewsByDay && viewsByDay.length > 0) {
          setStats(prevStats => ({
            ...prevStats,
            views: {
              ...prevStats.views,
              viewsByDay
            }
          }));
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu lượt xem theo ngày:', error);
      }
    };

    fetchViewsByDay();
  }, [viewsTimeRange]);

  // Cập nhật dữ liệu lượt xem theo truyện khi thay đổi giới hạn hoặc khoảng thời gian
  useEffect(() => {
    const fetchViewsByManga = async () => {
      try {
        const viewsByManga = await statisticsService.getViewsByManga(viewsTimeRange, mangaViewsLimit);
        if (viewsByManga && viewsByManga.length > 0) {
          setStats(prevStats => ({
            ...prevStats,
            views: {
              ...prevStats.views,
              viewsByManga
            }
          }));
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu lượt xem theo truyện:', error);
      }
    };

    fetchViewsByManga();
  }, [mangaViewsLimit, viewsTimeRange]);

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
          <>
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
                    {stats.users.usersByDay && stats.users.usersByDay.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={stats.users.usersByDay}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                            />
                            <YAxis />
                            <Tooltip
                              labelFormatter={(value) => `Ngày: ${new Date(value).toLocaleDateString('vi-VN')}`}
                              formatter={(value) => [`${value} người dùng`, 'Người dùng mới']}
                            />
                            <Legend />
                            <Bar dataKey="newUsers" name="Người dùng mới" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 h-80 flex items-center justify-center">
                        <div>
                          <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
                          <p>Không có dữ liệu về người dùng mới theo ngày</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Người dùng theo phương thức đăng nhập</h2>
                    {stats.users.usersByAuthProvider && stats.users.usersByAuthProvider.length > 0 ? (
                      <div className="h-80 flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="80%">
                          <PieChart>
                            <Pie
                              data={stats.users.usersByAuthProvider}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="provider"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {stats.users.usersByAuthProvider.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.provider === 'GOOGLE' ? '#ef4444' : '#3b82f6'}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => [`${value.toLocaleString()} người dùng`, '']}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full">
                          {stats.users.usersByAuthProvider.map((item, index) => (
                            <div key={index} className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 flex items-center">
                              <div className={`p-3 rounded-full ${item.provider === 'GOOGLE' ? 'bg-red-500' : 'bg-blue-500'} text-white mr-4`}>
                                <FontAwesomeIcon icon={item.provider === 'GOOGLE' ? faGoogle : faUserAlt} className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.provider}</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{item.count.toLocaleString()} người dùng</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 h-80 flex items-center justify-center">
                        <div>
                          <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
                          <p>Không có dữ liệu về phương thức đăng nhập</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mangas Tab */}
            {activeTab === 'mangas' && (
              <div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
                  <StatsCard
                    title="Tổng truyện"
                    value={stats.mangaStats.totalMangas}
                    icon={faBook}
                    color="bg-purple-500"
                  />
                  <StatsCard
                    title="Truyện hoạt động"
                    value={stats.mangaStats.activeMangas}
                    icon={faCheckCircle}
                    color="bg-green-500"
                  />
                  <StatsCard
                    title="Truyện đã xóa"
                    value={stats.mangaStats.deletedMangas}
                    icon={faTrash}
                    color="bg-red-500"
                  />
                  <StatsCard
                    title="Truyện mới hôm nay"
                    value={stats.mangaStats.newMangasToday}
                    icon={faCalendarAlt}
                    color="bg-blue-500"
                  />
                  <StatsCard
                    title="Truyện đang tiến hành"
                    value={stats.mangaStats.mangasByStatus && stats.mangaStats.mangasByStatus['ONGOING'] ? stats.mangaStats.mangasByStatus['ONGOING'] : 0}
                    icon={faSpinner}
                    color="bg-yellow-500"
                  />
                  <StatsCard
                    title="Truyện hoàn thành"
                    value={stats.mangaStats.mangasByStatus && stats.mangaStats.mangasByStatus['COMPLETED'] ? stats.mangaStats.mangasByStatus['COMPLETED'] : 0}
                    icon={faCheckCircle}
                    color="bg-teal-500"
                  />
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Truyện theo thể loại</h2>
                    {Object.keys(stats.mangaStats.mangasByGenre).length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart outerRadius={90} data={Object.entries(stats.mangaStats.mangasByGenre)
                            .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
                            .slice(0, 8) // Lấy 8 thể loại phổ biến nhất
                            .map(([genre, count]) => ({
                              genre,
                              count
                            }))}
                          >
                            <PolarGrid />
                            <PolarAngleAxis dataKey="genre" />
                            <PolarRadiusAxis />
                            <Radar name="Số lượng truyện" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                            <Tooltip formatter={(value) => [`${value} truyện`, '']}/>
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
                          <p>Không có dữ liệu về thể loại</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Truyện theo trạng thái</h2>
                    {Object.keys(stats.mangaStats.mangasByStatus).length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(stats.mangaStats.mangasByStatus).map(([status, count]) => {
                                // Chuyển đổi trạng thái sang tên hiển thị
                                const statusDisplayName = {
                                  'ONGOING': 'Đang tiến hành',
                                  'COMPLETED': 'Hoàn thành',
                                  'PAUSED': 'Tạm ngưng'
                                }[status] || status;

                                return {
                                  name: statusDisplayName,
                                  value: count
                                };
                              })}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {[
                                { status: 'ONGOING', color: '#eab308' },  // yellow-500
                                { status: 'COMPLETED', color: '#14b8a6' }, // teal-500
                                { status: 'PAUSED', color: '#ef4444' }     // red-500
                              ].map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => [`${value.toLocaleString()} truyện`, '']}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
                          <p>Không có dữ liệu về trạng thái</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Truyện được xem nhiều nhất</h2>
                  <div className="h-80">
                    {stats.mangas.mostViewedMangas && stats.mangas.mostViewedMangas.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stats.mangas.mostViewedMangas}
                          layout="vertical"
                          margin={{
                            top: 5,
                            right: 30,
                            left: 100,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis
                            type="category"
                            dataKey="title"
                            width={100}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip
                            formatter={(value) => [`${value.toLocaleString()} lượt xem`, '']}
                          />
                          <Legend />
                          <Bar dataKey="views" name="Lượt xem" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
                          <p>Chưa có dữ liệu về truyện được xem nhiều nhất</p>
                        </div>
                      </div>
                    )}
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

                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lượt xem theo ngày</h2>
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-500 dark:text-gray-400" />
                        <select
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                          value={viewsTimeRange}
                          onChange={(e) => setViewsTimeRange(Number(e.target.value) as 7 | 30 | 90)}
                        >
                          <option value="7">7 ngày qua</option>
                          <option value="30">30 ngày qua</option>
                          <option value="90">90 ngày qua</option>
                        </select>
                      </div>
                    </div>
                    <div className="h-80">
                      {stats.views.viewsByDay && stats.views.viewsByDay.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={stats.views.viewsByDay}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                              }}
                            />
                            <YAxis />
                            <Tooltip
                              labelFormatter={(value) => `Ngày: ${new Date(value).toLocaleDateString('vi-VN')}`}
                              formatter={(value, name, entry) => {
                                const formattedValue = value.toLocaleString();
                                let displayName;

                                // Xác định tên hiển thị dựa trên dataKey
                                if (entry && entry.dataKey) {
                                  switch(entry.dataKey) {
                                    case 'views':
                                      displayName = 'Tổng lượt xem';
                                      break;
                                    case 'registeredUserViews':
                                      displayName = 'Người dùng đăng nhập';
                                      break;
                                    case 'anonymousViews':
                                      displayName = 'Người dùng không đăng nhập';
                                      break;
                                    default:
                                      displayName = name;
                                  }
                                } else {
                                  displayName = name;
                                }

                                return [`${formattedValue} lượt xem`, displayName];
                              }}
                            />
                            <Legend />
                            <Bar dataKey="views" name="Tổng lượt xem" fill="#10b981" />
                            <Bar dataKey="registeredUserViews" name="Người dùng đăng nhập" fill="#3b82f6" />
                            <Bar dataKey="anonymousViews" name="Người dùng không đăng nhập" fill="#f59e0b" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center text-gray-500 dark:text-gray-400">
                            <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
                            <p>Không có dữ liệu lượt xem theo ngày</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lượt xem theo truyện</h2>
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faBook} className="text-gray-500 dark:text-gray-400" />
                        <select
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                          value={mangaViewsLimit}
                          onChange={(e) => setMangaViewsLimit(Number(e.target.value) as 5 | 10 | 20)}
                        >
                          <option value="5">5 truyện</option>
                          <option value="10">10 truyện</option>
                          <option value="20">20 truyện</option>
                        </select>
                      </div>
                    </div>
                    <div className="h-96">
                      {stats.views.viewsByManga && stats.views.viewsByManga.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={stats.views.viewsByManga}
                            layout="vertical"
                            margin={{
                              top: 5,
                              right: 30,
                              left: 150, // Thêm khoảng trống cho tiêu đề truyện
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis
                              type="category"
                              dataKey="title"
                              width={140}
                              tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                              formatter={(value, name, entry) => {
                                const formattedValue = value.toLocaleString();
                                let displayName;

                                // Xác định tên hiển thị dựa trên dataKey
                                if (entry && entry.dataKey) {
                                  switch(entry.dataKey) {
                                    case 'totalViews':
                                      displayName = 'Tổng lượt xem';
                                      break;
                                    case 'registeredUserViews':
                                      displayName = 'Người dùng đăng nhập';
                                      break;
                                    case 'anonymousViews':
                                      displayName = 'Người dùng không đăng nhập';
                                      break;
                                    default:
                                      displayName = name;
                                  }
                                } else {
                                  displayName = name;
                                }

                                return [`${formattedValue} lượt xem`, displayName];
                              }}
                            />
                            <Legend />
                            <Bar dataKey="totalViews" name="Tổng lượt xem" stackId="a" fill="#10b981" />
                            <Bar dataKey="registeredUserViews" name="Người dùng đăng nhập" stackId="b" fill="#3b82f6" />
                            <Bar dataKey="anonymousViews" name="Người dùng không đăng nhập" stackId="b" fill="#f59e0b" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center text-gray-500 dark:text-gray-400">
                            <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
                            <p>Không có dữ liệu lượt xem theo truyện</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
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
