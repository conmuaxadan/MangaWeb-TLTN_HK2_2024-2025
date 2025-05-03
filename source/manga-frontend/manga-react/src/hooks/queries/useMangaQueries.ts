import { useQuery } from '@tanstack/react-query';
import mangaService from '../../services/manga-service';
import { MangaResponse, PageResponse, MangaSummaryResponse } from '../../interfaces/models/manga';

// Các query keys
export const mangaKeys = {
  all: ['mangas'] as const,
  lists: () => [...mangaKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...mangaKeys.lists(), filters] as const,
  details: () => [...mangaKeys.all, 'detail'] as const,
  detail: (id: string) => [...mangaKeys.details(), id] as const,
};

// Hook lấy danh sách manga phân trang
export function useMangaList(page: number = 0, size: number = 10, sort?: string) {
  return useQuery({
    queryKey: mangaKeys.list({ page, size, sort }),
    queryFn: () => mangaService.getPaginatedMangas(page, size, sort),
    keepPreviousData: true, // Giữ dữ liệu cũ khi chuyển trang
  });
}

// Hook lấy chi tiết manga
export function useMangaDetail(id: string) {
  return useQuery({
    queryKey: mangaKeys.detail(id),
    queryFn: () => mangaService.getMangaById(id),
    enabled: !!id, // Chỉ gọi API khi có id
  });
}

// Hook lấy danh sách chapter của manga
export function useMangaChapters(mangaId: string) {
  return useQuery({
    queryKey: [...mangaKeys.detail(mangaId), 'chapters'],
    queryFn: () => mangaService.getChaptersByMangaId(mangaId),
    enabled: !!mangaId,
  });
}

// Hook lấy danh sách manga mới cập nhật
export function useLatestMangas(limit: number = 20) {
  return useQuery({
    queryKey: [...mangaKeys.lists(), 'latest', limit],
    queryFn: () => mangaService.getMangaSummaries(0, limit, "lastChapterAddedAt,desc"),
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}

// Hook lấy danh sách manga phổ biến
export function usePopularMangas(limit: number = 5) {
  return useQuery({
    queryKey: [...mangaKeys.lists(), 'popular', limit],
    queryFn: () => mangaService.getMangaSummaries(0, limit, "views,desc"),
    staleTime: 15 * 60 * 1000, // 15 phút
  });
}

// Hook tìm kiếm manga
export function useSearchMangas(keyword: string, page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: [...mangaKeys.lists(), 'search', keyword, page, size],
    queryFn: () => mangaService.searchManga(keyword, page, size),
    enabled: keyword.length > 0, // Chỉ tìm kiếm khi có keyword
    keepPreviousData: true,
  });
}

// Hook tìm kiếm manga theo thể loại
export function useMangasByGenre(genreName: string, page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: [...mangaKeys.lists(), 'genre', genreName, page, size],
    queryFn: () => mangaService.findByGenre(genreName, page, size),
    enabled: !!genreName, // Chỉ tìm kiếm khi có tên thể loại
    keepPreviousData: true,
  });
}

// Hook lấy gợi ý manga cá nhân dựa trên lịch sử đọc
export function usePersonalRecommendations(limit: number = 6) {
  return useQuery({
    queryKey: [...mangaKeys.lists(), 'personal-recommendations', limit],
    queryFn: () => mangaService.getPersonalRecommendations(limit),
    staleTime: 10 * 60 * 1000, // 10 phút
    // Không cần enabled vì service đã kiểm tra người dùng đăng nhập
  });
}
