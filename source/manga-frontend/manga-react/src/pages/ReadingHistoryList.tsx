import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ReadingHistoryResponse } from '../interfaces/models/profile';
import historyService from '../services/history-service';
import { useNavigate } from 'react-router-dom';
import ProfileLayout from '../components/layouts/ProfileLayout.tsx';
import { getMangaImageUrl } from '../utils/file-utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const ReadingHistoryList: React.FC = () => {
  const { user } = useAuth();
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra token trong localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchReadingHistory = async () => {
      setLoading(true);
      try {
        const result = await historyService.getMyReadingHistory();
        if (result) {
          console.log('Reading history data:', result);
          setReadingHistory(result);
        }
      } catch (error) {
        console.error('Lỗi khi tải lịch sử đọc:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReadingHistory();
  }, [user, navigate]);

  // Lịch sử đọc không thể bị xóa để đảm bảo tính nhất quán của dữ liệu

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <ProfileLayout>
      <div className="grid grid-cols-1 gap-[30px]">
        <div>
          <h5 className="text-xl font-semibold">Lịch sử đọc truyện:</h5>

        {readingHistory.length === 0 ? (
          <div className="mt-6 rounded-md bg-gray-800 p-6 shadow text-center">
            <p className="text-gray-400">Bạn chưa có lịch sử đọc nào.</p>
            <a href="/" className="mt-4 inline-block rounded-md border border-purple-600 bg-purple-600 px-5 py-2 text-center align-middle text-base font-semibold tracking-wide text-white duration-500 hover:border-purple-700 hover:bg-purple-700">
              Khám phá truyện
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[15px] md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mt-6">
            {readingHistory.map((history) => (
              <div key={history.id}>
                <div className="group">
                  <figure className="clearfix">
                    <div className="relative mb-2">
                      <a title={history.mangaTitle} href={`/mangas/${history.mangaId}`} className="block">
                        <div style={{ position: 'relative', width: '100%', paddingBottom: '150%' }}>
                          <div className="overflow-hidden rounded-lg group-hover:shadow-lg" style={{ position: 'absolute', inset: 0 }}>
                            <div className="absolute bottom-0 left-0 z-[1] h-3/5 w-full bg-gradient-to-t from-neutral-900 from-[15%] to-transparent transition-all duration-500 group-hover:h-3/4"></div>
                            <img
                              src={history.mangaCoverUrl ? getMangaImageUrl(history.mangaCoverUrl) : '/images/default-manga-cover.jpg'}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[102%]"
                              alt={history.mangaTitle}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/default-manga-cover.jpg';
                              }}
                            />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 z-[2] w-full px-2 py-1.5">
                          <h3 className="mb-1 line-clamp-2 text-[12px] font-semibold leading-tight text-white transition group-hover:line-clamp-3">
                            {history.mangaTitle}
                          </h3>
                          <p className="mb-1 text-[10px] text-gray-400 line-clamp-1">{history.author || 'Không rõ'}</p>
                          <span className="flex items-center justify-between gap-[4px] text-[10px] text-gray-300">
                            <span className="flex items-center gap-[4px]">
                              <i className="fa fa-book text-green-500"></i>Ch.{history.chapterNumber}
                            </span>
                            <span className="flex items-center gap-[4px]">
                              <i className="fa fa-clock text-purple-400"></i>
                              {formatDistanceToNow(new Date(history.updatedAt), { addSuffix: true, locale: vi }).replace('khoảng ', '')}
                            </span>
                          </span>
                        </div>
                      </a>
                    </div>
                  </figure>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </ProfileLayout>
  );
};

export default ReadingHistoryList;
