import { useState, useEffect } from 'react';
import mangaService from '../../services/manga-service';
import { MangaResponse, PageResponse, MangaSummaryResponse, ChapterResponse } from '../../interfaces/models/manga';

// Định nghĩa interface cho kết quả trả về từ các hooks
export interface QueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Hook lấy danh sách manga phân trang
export function useMangaList(page: number = 0, size: number = 10, sort?: string): QueryResult<PageResponse<MangaResponse>> {
  const [data, setData] = useState<PageResponse<MangaResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await mangaService.getPaginatedMangas(page, size, sort);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching manga list:', err);
      setError('Không thể tải danh sách manga');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, size, sort]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook lấy chi tiết manga
export function useMangaDetail(id: string): QueryResult<MangaResponse> {
  const [data, setData] = useState<MangaResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await mangaService.getMangaById(id);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching manga details:', err);
      setError('Không thể tải thông tin manga');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook lấy danh sách chapter của manga
export function useMangaChapters(mangaId: string): QueryResult<ChapterResponse[]> {
  const [data, setData] = useState<ChapterResponse[] | null>(null);
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
      const result = await mangaService.getChaptersByMangaId(mangaId);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching manga chapters:', err);
      setError('Không thể tải danh sách chapter');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [mangaId]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook lấy danh sách manga mới cập nhật
export function useLatestMangas(limit: number = 20): QueryResult<PageResponse<MangaSummaryResponse>> {
  const [data, setData] = useState<PageResponse<MangaSummaryResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await mangaService.getMangaSummaries(0, limit, "lastChapterAddedAt,desc");
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching latest mangas:', err);
      setError('Không thể tải danh sách manga mới cập nhật');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [limit]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook lấy danh sách manga phổ biến
export function usePopularMangas(limit: number = 5): QueryResult<PageResponse<MangaSummaryResponse>> {
  const [data, setData] = useState<PageResponse<MangaSummaryResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await mangaService.getMangaSummaries(0, limit, "views,desc");
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching popular mangas:', err);
      setError('Không thể tải danh sách manga phổ biến');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [limit]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook tìm kiếm manga
export function useSearchMangas(keyword: string, page: number = 0, size: number = 10): QueryResult<PageResponse<MangaResponse>> {
  const [data, setData] = useState<PageResponse<MangaResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!keyword || keyword.length === 0) {
      setData(null);
      return;
    }

    try {
      setIsLoading(true);
      const result = await mangaService.searchManga(keyword, page, size);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error searching mangas:', err);
      setError('Không thể tìm kiếm manga');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [keyword, page, size]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook tìm kiếm manga theo thể loại
export function useMangasByGenre(genreName: string, page: number = 0, size: number = 10): QueryResult<PageResponse<MangaResponse>> {
  const [data, setData] = useState<PageResponse<MangaResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!genreName) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await mangaService.findByGenre(genreName, page, size);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching mangas by genre:', err);
      setError('Không thể tải danh sách manga theo thể loại');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [genreName, page, size]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook lấy gợi ý manga cá nhân dựa trên lịch sử đọc
export function usePersonalRecommendations(limit: number = 6): QueryResult<MangaResponse[]> {
  const [data, setData] = useState<MangaResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await mangaService.getPersonalRecommendations(limit);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching personal recommendations:', err);
      setError('Không thể tải gợi ý cá nhân');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [limit]);

  return { data, isLoading, error, refetch: fetchData };
}
