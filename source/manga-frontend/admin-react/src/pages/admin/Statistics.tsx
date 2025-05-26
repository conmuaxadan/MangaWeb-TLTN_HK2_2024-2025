import React, { lazy, Suspense } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faBook,
  faEye,
  faSpinner,
  faSync
} from '@fortawesome/free-solid-svg-icons';

import useStatistics from '../../hooks/useStatistics';

// Lazy load các component tab để cải thiện hiệu suất khi tải trang
const UsersTab = lazy(() => import('../../components/statistics/UsersTab'));
const MangasTab = lazy(() => import('../../components/statistics/MangasTab'));
const ViewsTab = lazy(() => import('../../components/statistics/ViewsTab'));

const Statistics: React.FC = () => {
  // Sử dụng custom hook
  const {
    activeTab,
    startDate,
    endDate,
    mangaViewsLimit,
    stats,
    loading,
    setActiveTab,
    setStartDate,
    setEndDate,
    setMangaViewsLimit,
    refreshData
  } = useStatistics();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thống kê chi tiết</h1>

        {/* Thêm nút làm mới dữ liệu */}
        <button
          onClick={() => refreshData()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          disabled={loading}
        >
          <FontAwesomeIcon icon={loading ? faSpinner : faSync} spin={loading} />
          <span>{loading ? 'Đang làm mới...' : 'Làm mới dữ liệu'}</span>
        </button>
      </div>

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
