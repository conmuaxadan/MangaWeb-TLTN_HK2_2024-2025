import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faBook,
  faEye,
  faComment,
  faHeart,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import StatsCard from '../../components/dashboard/StatsCard';
import RecentMangasTable from '../../components/dashboard/RecentMangasTable';
import RecentUsersTable from '../../components/dashboard/RecentUsersTable';
import useDashboard from '../../hooks/useDashboard';

const Dashboard: React.FC = () => {
  // Sử dụng custom hook
  const {
    recentMangas,
    recentUsers,
    loadingStats,
    loadingMangas,
    loadingUsers,
    errorStats,
    errorMangas,
    errorUsers,
    statsCards
  } = useDashboard();

  // Map icon strings từ hook về các icon thực tế
  const iconMap = {
    faUsers,
    faBook,
    faEye,
    faComment,
    faHeart
  };

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
              icon={iconMap[card.icon as keyof typeof iconMap]}
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
