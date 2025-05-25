import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { ChapterResponse, MangaResponse, MangaQuickSearchResponse } from '../interfaces/models/manga';
import mangaService from '../services/manga-service';

export const useChapterManagement = (itemsPerPage: number = 10) => {
  // State cho danh sách chapter
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [availableMangas, setAvailableMangas] = useState<MangaResponse[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // State cho thao tác CRUD
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State cho lọc manga
  const [filterManga, setFilterManga] = useState('');
  const [selectedFilterManga, setSelectedFilterManga] = useState<MangaQuickSearchResponse | null>(null);
  const [filterSearchTerm, setFilterSearchTerm] = useState('');
  const [filterSearchResults, setFilterSearchResults] = useState<MangaQuickSearchResponse[]>([]);
  const [showFilterResults, setShowFilterResults] = useState(false);

  // State cho tìm kiếm manga
  const [mangaSearchTerm, setMangaSearchTerm] = useState('');
  const [mangaSearchResults, setMangaSearchResults] = useState<MangaQuickSearchResponse[]>([]);
  const [showMangaResults, setShowMangaResults] = useState(false);
  const [selectedManga, setSelectedManga] = useState<MangaQuickSearchResponse | null>(null);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Tải danh sách chapter và manga khi component mount hoặc khi currentPage thay đổi
  useEffect(() => {
    fetchChapters();
    if (availableMangas.length === 0) {
      fetchMangas();
    }
  }, [currentPage]);

  // Reset về trang đầu tiên khi filter thay đổi
  useEffect(() => {
    console.log('🔄 Resetting currentPage to 1 due to filter change:', { filterManga });
    setCurrentPage(1);
  }, [filterManga]);

  // Hàm lấy danh sách chapter với phân trang server-side
  const fetchChapters = useCallback(async () => {
    console.log('🔥 fetchChapters called with dependencies:', { currentPage, itemsPerPage, filterManga });
    setIsLoading(true);
    setError(null);
    try {
      console.log('Bắt đầu gọi API lấy danh sách chapter với phân trang và filter');

      // Chuẩn bị filter parameters
      const mangaId = filterManga || undefined;
      console.log('Filter parameters:', { filterManga, mangaId, currentPage, itemsPerPage });

      // Gọi API với phân trang server-side và filter
      const response = await mangaService.getAllChapters(currentPage - 1, itemsPerPage, mangaId);

      if (response) {
        console.log('Có dữ liệu phân trang từ API:', response);
        setChapters(response.content || []);
        setTotalItems(response.totalElements || 0);
        setTotalPages(response.totalPages || 1);
      } else {
        console.log('Không lấy được dữ liệu chapter từ API');
        setChapters([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(new Error(errorMessage));
      setChapters([]);
      console.error('Lỗi khi lấy danh sách chapter:', errorMessage);
      toast.error('Không thể lấy danh sách chapter. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, filterManga]);

  // Force fetch khi filterManga thay đổi (ngay cả khi currentPage đã là 1)
  useEffect(() => {
    console.log('🚀 Force fetching due to filterManga change:', filterManga);
    fetchChapters();
  }, [filterManga, fetchChapters]);

  // Hàm lấy danh sách manga
  const fetchMangas = useCallback(async () => {
    try {
      console.log('Fetching available mangas for dropdown...');
      // Lấy danh sách tất cả manga để hiển thị trong dropdown
      const allMangas = await mangaService.getAllMangas(0, 1000);
      console.log('Available mangas response:', allMangas);
      if (allMangas && allMangas.content) {
        console.log('Setting available mangas:', allMangas.content.length);
        setAvailableMangas(allMangas.content);
      } else {
        console.log('No manga content found');
        setAvailableMangas([]);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách manga:', err);
      setAvailableMangas([]);
    }
  }, []);

  // Tìm kiếm manga
  const searchMangas = useCallback(async (term: string) => {
    if (!term) {
      setMangaSearchResults([]);
      return;
    }

    try {
      console.log('Tìm kiếm nhanh manga với từ khóa:', term);
      const results = await mangaService.quickSearchManga(term, 20);
      console.log('Kết quả tìm kiếm nhanh manga:', results);
      setMangaSearchResults(results);
    } catch (err) {
      console.error('Lỗi khi tìm kiếm nhanh manga:', err);
      setMangaSearchResults([]);
    }
  }, []);

  // Theo dõi thay đổi trong mangaSearchTerm
  useEffect(() => {
    if (mangaSearchTerm) {
      searchMangas(mangaSearchTerm);
    } else {
      setMangaSearchResults([]);
    }
  }, [mangaSearchTerm, searchMangas]);

  // Chọn manga
  const selectManga = (manga: MangaQuickSearchResponse) => {
    setSelectedManga(manga);
    setShowMangaResults(false);
  };

  // Filter manga search functions
  const handleFilterSearchChange = async (value: string) => {
    setFilterSearchTerm(value);

    if (!value) {
      setFilterSearchResults([]);
      setShowFilterResults(false);
      return;
    }

    try {
      const results = await mangaService.quickSearchManga(value, 10);
      setFilterSearchResults(results);
      setShowFilterResults(true);
    } catch (err) {
      console.error('Lỗi khi tìm kiếm manga cho filter:', err);
      setFilterSearchResults([]);
      setShowFilterResults(false);
    }
  };

  const handleSelectFilterManga = (manga: MangaQuickSearchResponse) => {
    setSelectedFilterManga(manga);
    setFilterManga(manga.id);
    setFilterSearchTerm('');
    setShowFilterResults(false);
  };

  const handleClearFilterManga = () => {
    setSelectedFilterManga(null);
    setFilterManga('');
    setFilterSearchTerm('');
    setShowFilterResults(false);
  };

  // Xóa manga đã chọn
  const clearSelectedManga = () => {
    setSelectedManga(null);
    setMangaSearchTerm('');
    setMangaSearchResults([]);
  };

  // Thêm chapter mới
  const createChapter = async (formData: FormData): Promise<ChapterResponse | null> => {
    setIsSubmitting(true);
    try {
      const response = await mangaService.createChapter(formData);
      if (response) {
        await fetchChapters(); // Tải lại danh sách sau khi thêm mới
        return response;
      }
      return null;
    } catch (error) {
      console.error('Lỗi khi thêm chapter mới:', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật chapter
  const updateChapter = async (chapterId: string, formData: FormData): Promise<ChapterResponse | null> => {
    setIsSubmitting(true);
    try {
      const response = await mangaService.updateChapter(chapterId, formData);
      if (response) {
        await fetchChapters(); // Tải lại danh sách sau khi cập nhật
        return response;
      }
      return null;
    } catch (error) {
      console.error(`Lỗi khi cập nhật chapter ID ${chapterId}:`, error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa chapter
  const deleteChapter = async (chapterId: string | undefined): Promise<boolean> => {
    try {
      const success = await mangaService.deleteChapter(chapterId);
      if (success) {
        await fetchChapters(); // Tải lại danh sách sau khi xóa
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Lỗi khi xóa chapter ID ${chapterId}:`, error);
      return false;
    }
  };

  // Lấy danh sách chapter hiện tại (đã được filter và phân trang từ backend)
  const currentChapters = chapters;

  // Chỉ số của item đầu tiên và cuối cùng trên trang hiện tại
  const showingFrom = (currentPage - 1) * itemsPerPage + 1;
  const showingTo = Math.min(currentPage * itemsPerPage, totalItems);

  // Tính số trang dựa trên tổng số item và số item trên mỗi trang
  // Lưu ý: totalPages đã được tính từ API nên không cần tính toán nữa

  return {
    // Data
    chapters,
    currentChapters,
    availableMangas,

    // Manga search
    mangaSearchTerm,
    mangaSearchResults,
    showMangaResults,
    selectedManga,
    setMangaSearchTerm,
    setShowMangaResults,
    selectManga,
    clearSelectedManga,

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    showingFrom,
    showingTo,

    // Filter
    filterManga,
    setFilterManga,
    selectedFilterManga,
    filterSearchTerm,
    filterSearchResults,
    showFilterResults,
    handleFilterSearchChange,
    handleSelectFilterManga,
    handleClearFilterManga,

    // Loading states
    isLoading,
    isSubmitting,
    error,

    // CRUD operations
    createChapter,
    updateChapter,
    deleteChapter,

    // Refresh data
    refreshData: fetchChapters
  };
};

export default useChapterManagement;
