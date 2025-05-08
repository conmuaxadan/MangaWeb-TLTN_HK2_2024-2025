import { useState, useEffect } from 'react';
import profileService from '../../services/profile-service';
import authService from '../../services/auth-service';
import { QueryResult } from './useMangaQueries';
import { UserProfileResponse, ReadingHistoryResponse, FavoriteMangaResponse, CommentResponse } from '../../interfaces/models/profile';

// Hook lấy thông tin profile người dùng hiện tại
export function useCurrentUserProfile(): QueryResult<UserProfileResponse> {
  const [data, setData] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const tokenInfo = authService.getCurrentUser();
      if (!tokenInfo) {
        setData(null);
        setError(null);
        return;
      }
      const result = await profileService.getUserProfileByUserId(tokenInfo.userId);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Không thể tải thông tin profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook lấy danh sách manga yêu thích
export function useFavoriteMangas(): QueryResult<FavoriteMangaResponse[]> {
  const [data, setData] = useState<FavoriteMangaResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await profileService.getMyFavorites();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching favorite mangas:', err);
      setError('Không thể tải danh sách manga yêu thích');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook kiểm tra manga có trong danh sách yêu thích không
export function useIsMangaFavorite(mangaId: string): QueryResult<boolean> {
  const [data, setData] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!mangaId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await profileService.isMangaFavorite(mangaId);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error checking if manga is favorite:', err);
      setError('Không thể kiểm tra trạng thái yêu thích');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [mangaId]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook thêm/xóa manga yêu thích
export function useFavoriteMutation() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async ({ mangaId, isFavorite }: { mangaId: string, isFavorite: boolean }) => {
    try {
      setIsLoading(true);
      setError(null);

      if (isFavorite) {
        await profileService.addFavorite(mangaId);
      } else {
        await profileService.removeFavorite(mangaId);
      }

      return true;
    } catch (err) {
      console.error('Error updating favorite status:', err);
      setError('Không thể cập nhật trạng thái yêu thích');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
}

// Hook lấy lịch sử đọc truyện
export function useReadingHistory(): QueryResult<ReadingHistoryResponse[]> {
  const [data, setData] = useState<ReadingHistoryResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await profileService.getMyReadingHistory();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching reading history:', err);
      setError('Không thể tải lịch sử đọc truyện');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook lấy lịch sử đọc gần đây (3 truyện gần nhất)
export function useRecentReadingHistory(limit: number = 3): QueryResult<ReadingHistoryResponse[]> {
  const [data, setData] = useState<ReadingHistoryResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const history = await profileService.getMyReadingHistory();

      if (!history) {
        setData([]);
        return;
      }

      // Lọc theo mangaId để chỉ lấy mỗi manga một lần (chapter mới nhất)
      const uniqueMangaMap = new Map();
      history.forEach(item => {
        if (!uniqueMangaMap.has(item.mangaId) ||
            new Date(uniqueMangaMap.get(item.mangaId).updatedAt) < new Date(item.updatedAt)) {
          uniqueMangaMap.set(item.mangaId, item);
        }
      });

      // Chuyển map thành mảng và sắp xếp theo thời gian gần nhất
      const result = Array.from(uniqueMangaMap.values())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, limit);

      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching recent reading history:', err);
      setError('Không thể tải lịch sử đọc gần đây');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [limit]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook đánh dấu đã đọc chapter
export function useMarkAsReadMutation() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async ({ mangaId, chapterId }: { mangaId: string, chapterId: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      await profileService.markChapterAsRead(mangaId, chapterId);
      return true;
    } catch (err) {
      console.error('Error marking chapter as read:', err);
      setError('Không thể đánh dấu chapter đã đọc');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
}

// Hook lấy bình luận gần đây
export function useRecentComments(limit: number = 10): QueryResult<CommentResponse[]> {
  const [data, setData] = useState<CommentResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await profileService.getLatestComments(limit);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching recent comments:', err);
      setError('Không thể tải bình luận gần đây');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [limit]);

  return { data, isLoading, error, refetch: fetchData };
}
