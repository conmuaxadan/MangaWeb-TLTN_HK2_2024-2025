import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ReadingHistoryResponse } from '../interfaces/models/profile';
import profileService from '../services/profile-service';
import { useNavigate } from 'react-router-dom';
import ProfileLayout from '../components/layouts/ProfileLayout.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faBookOpen, faClock } from '@fortawesome/free-solid-svg-icons';
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
        const result = await profileService.getMyReadingHistory();
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
          <div className="mt-6 space-y-4">
            {readingHistory.map((history) => (
              <div key={history.id} className="group bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex">
                  {/* Ảnh bìa */}
                  <div className="w-[100px] h-[150px] shrink-0">
                    <a href={`/mangas/${history.mangaId}`} className="block h-full">
                      <img
                        src={history.mangaCoverUrl ? `http://localhost:8888/api/v1/upload/files/${history.mangaCoverUrl}` : '/images/default-manga-cover.jpg'}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[102%]"
                        alt={history.mangaTitle}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/default-manga-cover.jpg';
                        }}
                      />
                    </a>
                  </div>

                  {/* Thông tin truyện */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <a href={`/mangas/${history.mangaId}`} className="block">
                        <h3 className="text-base font-semibold text-white mb-2 hover:text-purple-400 transition-colors">
                          {history.mangaTitle}
                        </h3>
                      </a>

                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                        <a
                          href={`/mangas/${history.mangaId}/chapters/${history.chapterId}`}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                        >
                          <FontAwesomeIcon icon={faBookOpen} className="text-green-500" />
                          Chapter {history.chapterNumber}
                        </a>
                        {/* Không còn hiển thị trang đã đọc nữa */}
                      </div>

                      <div className="text-sm text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faClock} className="text-purple-400" />
                          Đọc gần nhất: {history.updatedAt ? formatDistanceToNow(new Date(history.updatedAt), { locale: vi, addSuffix: false }) : ''} trước
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
};

export default ReadingHistoryList;
