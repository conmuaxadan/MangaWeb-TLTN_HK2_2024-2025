import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FavoriteMangaResponse } from '../interfaces/models/profile';
import profileService from '../services/profile-service';
import { useNavigate } from 'react-router-dom';
import ProfileLayout from '../components/layouts/ProfileLayout.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEye, faHeart, faComment, faBookOpen } from '@fortawesome/free-solid-svg-icons';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';

const FavoriteList: React.FC = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteMangaResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra token trong localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const result = await profileService.getMyFavorites();
        if (result) {
          setFavorites(result);
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách yêu thích:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user, navigate]);

  const handleRemoveFavorite = async (mangaId: string) => {
    try {
      const success = await profileService.removeFavorite(mangaId);
      if (success) {
        toast.success('Đã xóa khỏi danh sách yêu thích', { position: 'top-right' });
        // Cập nhật lại danh sách yêu thích
        setFavorites(favorites.filter(fav => fav.mangaId !== mangaId));
      }
    } catch (error) {
      console.error('Lỗi khi xóa khỏi danh sách yêu thích:', error);
      toast.error('Không thể xóa khỏi danh sách yêu thích', { position: 'top-right' });
    }
  };

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
        <h5 className="text-xl font-semibold">Danh sách truyện yêu thích:</h5>

        {favorites.length === 0 ? (
          <div className="mt-6 rounded-md bg-gray-800 p-6 shadow text-center">
            <p className="text-gray-400">Bạn chưa có truyện yêu thích nào.</p>
            <a href="/" className="mt-4 inline-block rounded-md border border-purple-600 bg-purple-600 px-5 py-2 text-center align-middle text-base font-semibold tracking-wide text-white duration-500 hover:border-purple-700 hover:bg-purple-700">
              Khám phá truyện
            </a>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="group bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex">
                  {/* Ảnh bìa */}
                  <div className="w-[100px] h-[150px] shrink-0">
                    <a href={`/mangas/${favorite.mangaId}`} className="block h-full">
                      <img
                        src={favorite.mangaCoverUrl ? `http://localhost:8888/api/v1/upload/files/${favorite.mangaCoverUrl}` : '/images/default-manga-cover.jpg'}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[102%]"
                        alt={favorite.mangaTitle}
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
                      <a href={`/mangas/${favorite.mangaId}`} className="block">
                        <h3 className="text-base font-semibold text-white mb-2 hover:text-purple-400 transition-colors">
                          {favorite.mangaTitle}
                        </h3>
                      </a>

                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faEye} className="text-yellow-500" />
                          {favorite.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faComment} className="text-blue-400" />
                          {favorite.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faHeart} className="text-red-500" />
                          {favorite.loves}
                        </span>
                        {favorite.lastChapterNumber && (
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faBookOpen} className="text-green-500" />
                            C.{favorite.lastChapterNumber}
                          </span>
                        )}
                      </div>

                      {favorite.author && (
                        <p className="text-sm text-gray-400 mb-2">
                          <span className="text-purple-400">Tác giả:</span> {favorite.author}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-400">
                        <div>Đã thêm: {favorite.addedAt ? formatDistanceToNow(new Date(favorite.addedAt), { locale: vi, addSuffix: false }) : ''} trước</div>
                        {favorite.lastChapterAddedAt && (
                          <div>Cập nhật: {formatDistanceToNow(new Date(favorite.lastChapterAddedAt), { locale: vi, addSuffix: false })} trước</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveFavorite(favorite.mangaId)}
                        className="text-red-500 hover:text-red-700 transition-colors px-3 py-1 rounded-md border border-red-500 hover:bg-red-500/10"
                        title="Xóa khỏi danh sách yêu thích"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-1" /> Xóa
                      </button>
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

export default FavoriteList;
