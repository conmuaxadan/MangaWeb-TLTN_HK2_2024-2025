import React from 'react';
import { faBook, faCheckCircle, faTrash, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { MangaGenreChart, MangaStatusChart } from './ChartComponents';
import StatsCard from './StatsCard';

interface MangasTabProps {
  mangaStats: {
    totalMangas: number;
    activeMangas: number;
    deletedMangas: number;
    newMangasToday: number;
    mangasByGenre: Record<string, number>;
    mangasByStatus: Record<string, number>;
  };
  mangas: {
    totalMangas: number;
    newMangasToday: number;
    ongoingMangas: number;
    completedMangas: number;
  };
}

const MangasTab: React.FC<MangasTabProps> = React.memo(({ mangaStats }) => {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        <StatsCard
          title="Tổng truyện"
          value={mangaStats.totalMangas}
          icon={faBook}
          color="bg-purple-500"
        />
        <StatsCard
          title="Truyện hoạt động"
          value={mangaStats.activeMangas}
          icon={faCheckCircle}
          color="bg-green-500"
        />
        <StatsCard
          title="Truyện đã xóa"
          value={mangaStats.deletedMangas}
          icon={faTrash}
          color="bg-red-500"
        />
        <StatsCard
          title="Truyện mới hôm nay"
          value={mangaStats.newMangasToday}
          icon={faCalendarAlt}
          color="bg-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MangaGenreChart data={mangaStats.mangasByGenre || {}} />
        <MangaStatusChart data={mangaStats.mangasByStatus || {}} />
      </div>
    </div>
  );
});

export default MangasTab;
