import React from 'react';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { NewUsersByDayChart, UsersByAuthProviderChart } from './ChartComponents';
import StatsCard from './StatsCard';

interface UsersTabProps {
  data: {
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    usersByDay: Array<{ date: string; newUsers: number }>;
    usersByAuthProvider: Array<{ provider: string; count: number }>;
  };
}

const UsersTab: React.FC<UsersTabProps> = React.memo(({ data }) => {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Tổng người dùng"
          value={data.totalUsers}
          icon={faUsers}
          color="bg-blue-500"
        />
        <StatsCard
          title="Người dùng mới hôm nay"
          value={data.newUsersToday}
          icon={faUsers}
          color="bg-green-500"
        />
        <StatsCard
          title="Người dùng mới tuần này"
          value={data.newUsersThisWeek}
          icon={faUsers}
          color="bg-purple-500"
        />
        <StatsCard
          title="Người dùng mới tháng này"
          value={data.newUsersThisMonth}
          icon={faUsers}
          color="bg-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NewUsersByDayChart data={data.usersByDay || []} />
        <UsersByAuthProviderChart data={data.usersByAuthProvider || []} />
      </div>
    </div>
  );
});

export default UsersTab;
