import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FavoriteResponse } from '../interfaces/models/profile';
import favoriteService from '../services/favorite-service';
import { useNavigate } from 'react-router-dom';
import ProfileLayout from '../components/layouts/ProfileLayout.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash} from '@fortawesome/free-solid-svg-icons';
import { getMangaImageUrl } from '../utils/file-utils';
import { toast } from 'react-toastify';

const FavoriteList: React.FC = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteResponse[]>([]);
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
        const result = await favoriteService.getFavorites();
        if (result) {
          setFavorites(result.content || []);
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
      const success = await favoriteService.removeFavorite(mangaId);
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
      <div className="grid grid-cols-1 gap-[30px]">
        <div>
          <h5 className="text-xl font-semibold">Danh sách truyện yêu thích:</h5>

        {favorites.length === 0 ? (
          <div className="mt-6 rounded-md bg-white p-6 shadow text-center">
            <p className="text-gray-600">Bạn chưa có truyện yêu thích nào.</p>
            <a href="/" className="mt-4 inline-block rounded-md border border-purple-600 bg-purple-600 px-5 py-2 text-center align-middle text-base font-semibold tracking-wide text-white duration-500 hover:border-purple-700 hover:bg-purple-700">
              Khám phá truyện
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[15px] md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mt-6">
            {favorites.map((favorite) => (
              <div key={favorite.mangaId}>
                <div className="group">
                  <figure className="clearfix">
                    <div className="relative mb-2">
                      <a title={favorite.mangaTitle} href={`/mangas/${favorite.mangaId}`} className="block">
                        <div style={{ position: 'relative', width: '100%', paddingBottom: '150%' }}>
                          <div className="overflow-hidden rounded-lg group-hover:shadow-lg" style={{ position: 'absolute', inset: 0 }}>
                            <div className="absolute bottom-0 left-0 z-[1] h-3/5 w-full bg-gradient-to-t from-neutral-900 from-[15%] to-transparent transition-all duration-500 group-hover:h-3/4"></div>
                            <img
                              src={favorite.mangaCoverUrl ? getMangaImageUrl(favorite.mangaCoverUrl) : '/images/default-manga-cover.jpg'}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[102%]"
                              alt={favorite.mangaTitle}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/default-manga-cover.jpg';
                              }}
                            />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 z-[2] w-full px-2 py-1.5">
                          <h3 className="mb-1 line-clamp-2 text-[12px] font-semibold leading-tight text-white transition group-hover:line-clamp-3">
                            {favorite.mangaTitle}
                          </h3>
                          <p className="mb-1 text-[10px] text-gray-400 line-clamp-1">{favorite.author || 'Không rõ'}</p>
                          <span className="flex items-center justify-between gap-[4px] text-[10px] text-gray-300">
                            <span className="flex items-center gap-[4px]">
                              <i className="fa fa-eye text-yellow-500"></i>{favorite.views || 0}
                            </span>
                            <span className="flex items-center gap-[4px]">
                              <i className="fa fa-comment text-blue-400"></i>{favorite.comments || 0}
                            </span>
                            <span className="flex items-center gap-[4px]">
                              <i className="fa fa-heart text-red-500"></i>{favorite.loves || 0}
                            </span>
                          </span>
                        </div>
                      </a>
                    </div>
                  </figure>
                </div>
                <button
                  onClick={() => handleRemoveFavorite(favorite.mangaId)}
                  className="justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex h-auto items-center gap-2 bg-purple-600 px-3 py-2 text-[12px] text-white hover:bg-purple-700 mt-2 w-full"
                >
                  <span className="shrink-0">
                    <FontAwesomeIcon icon={faTrash} />
                  </span>
                  Bỏ theo dõi
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </ProfileLayout>
  );
};

export default FavoriteList;
