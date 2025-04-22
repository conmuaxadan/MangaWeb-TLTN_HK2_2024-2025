import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import profileService from '../../services/profile-service';
import authService from '../../services/auth-service';

// Các query keys
export const profileKeys = {
  all: ['profile'] as const,
  user: () => [...profileKeys.all, 'user'] as const,
  currentUser: () => [...profileKeys.user(), 'current'] as const,
  favorites: () => [...profileKeys.all, 'favorites'] as const,
  history: () => [...profileKeys.all, 'history'] as const,
  comments: () => [...profileKeys.all, 'comments'] as const,
};

// Hook lấy thông tin profile người dùng hiện tại
export function useCurrentUserProfile() {
  return useQuery({
    queryKey: profileKeys.currentUser(),
    queryFn: async () => {
      const tokenInfo = authService.getCurrentUser();
      if (!tokenInfo) return null;
      return profileService.getUserProfileByUserId(tokenInfo.userId);
    },
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}

// Hook lấy danh sách manga yêu thích
export function useFavoriteMangas() {
  return useQuery({
    queryKey: profileKeys.favorites(),
    queryFn: () => profileService.getMyFavorites(),
  });
}

// Hook kiểm tra manga có trong danh sách yêu thích không
export function useIsMangaFavorite(mangaId: string) {
  return useQuery({
    queryKey: [...profileKeys.favorites(), mangaId],
    queryFn: () => profileService.isMangaFavorite(mangaId),
    enabled: !!mangaId,
  });
}

// Hook thêm/xóa manga yêu thích
export function useFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mangaId, isFavorite }: { mangaId: string, isFavorite: boolean }) =>
      isFavorite
        ? profileService.addFavorite(mangaId)
        : profileService.removeFavorite(mangaId),
    onSuccess: (_, variables) => {
      // Làm mới danh sách yêu thích sau khi thêm/xóa
      queryClient.invalidateQueries({ queryKey: profileKeys.favorites() });
      // Làm mới trạng thái yêu thích của manga cụ thể
      queryClient.invalidateQueries({ queryKey: [...profileKeys.favorites(), variables.mangaId] });
    },
  });
}

// Hook lấy lịch sử đọc truyện
export function useReadingHistory() {
  return useQuery({
    queryKey: profileKeys.history(),
    queryFn: () => profileService.getMyReadingHistory(),
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}

// Hook lấy lịch sử đọc gần đây (3 truyện gần nhất)
export function useRecentReadingHistory(limit: number = 3) {
  return useQuery({
    queryKey: [...profileKeys.history(), 'recent', limit],
    queryFn: async () => {
      const history = await profileService.getMyReadingHistory();
      if (!history) return [];

      // Lọc theo mangaId để chỉ lấy mỗi manga một lần (chapter mới nhất)
      const uniqueMangaMap = new Map();
      history.forEach(item => {
        if (!uniqueMangaMap.has(item.mangaId) ||
            new Date(uniqueMangaMap.get(item.mangaId).updatedAt) < new Date(item.updatedAt)) {
          uniqueMangaMap.set(item.mangaId, item);
        }
      });

      // Chuyển map thành mảng và sắp xếp theo thời gian gần nhất
      return Array.from(uniqueMangaMap.values())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, limit);
    },
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}

// Hook đánh dấu đã đọc chapter
export function useMarkAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mangaId, chapterId }: { mangaId: string, chapterId: string }) =>
      profileService.markChapterAsRead(mangaId, chapterId),
    onSuccess: () => {
      // Làm mới lịch sử đọc sau khi đánh dấu
      queryClient.invalidateQueries({ queryKey: profileKeys.history() });
    },
  });
}

// Hook lấy bình luận gần đây
export function useRecentComments(limit: number = 10) {
  return useQuery({
    queryKey: [...profileKeys.comments(), 'recent', limit],
    queryFn: () => profileService.getLatestComments(limit),
    staleTime: 2 * 60 * 1000, // 2 phút
  });
}
