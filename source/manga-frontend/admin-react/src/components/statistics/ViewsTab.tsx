import React from 'react';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { ViewsByDayChart, ViewsByMangaChart } from './ChartComponents';
import StatsCard from './StatsCard';

interface ViewsTabProps {
  data: {
    totalViews: number;
    viewsToday: number;
    viewsThisWeek: number;
    viewsThisMonth: number;
    viewsByDay: Array<any>;
    viewsByManga: Array<any>;
  };
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  mangaViewsLimit: number;
  setMangaViewsLimit: (limit: number) => void;
}

const ViewsTab: React.FC<ViewsTabProps> = React.memo(({
  data,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  mangaViewsLimit,
  setMangaViewsLimit
}) => {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Tổng lượt xem"
          value={data.totalViews}
          icon={faEye}
          color="bg-green-500"
        />
        <StatsCard
          title="Lượt xem hôm nay"
          value={data.viewsToday}
          icon={faEye}
          color="bg-blue-500"
        />
        <StatsCard
          title="Lượt xem tuần này"
          value={data.viewsThisWeek}
          icon={faEye}
          color="bg-purple-500"
        />
        <StatsCard
          title="Lượt xem tháng này"
          value={data.viewsThisMonth}
          icon={faEye}
          color="bg-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Luôn hiển thị container lượt xem theo ngày */}
        <ViewsByDayChart
          data={data.viewsByDay || []}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />

        {/* Luôn hiển thị container lượt xem theo truyện */}
        <ViewsByMangaChart
          data={data.viewsByManga || []}
          limit={mangaViewsLimit}
          setLimit={setMangaViewsLimit}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </div>
  );
});

export default ViewsTab;
