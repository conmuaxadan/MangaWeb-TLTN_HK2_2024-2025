import { useState, useEffect, useCallback } from 'react';
import chapterService from '../services/chapter-service.js';
import mangaService from '../services/manga-service.js';
import { toast } from 'react-toastify';

export const useTranslatorChapterManagement = (initialItemsPerPage = 10) => {
  // State cho danh sách chapter
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State cho thao tác CRUD
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);



  // State cho lọc manga
  const [filterManga, setFilterManga] = useState('');
  const [selectedFilterManga, setSelectedFilterManga] = useState(null);
  const [filterSearchTerm, setFilterSearchTerm] = useState('');
  const [filterSearchResults, setFilterSearchResults] = useState([]);
  const [showFilterResults, setShowFilterResults] = useState(false);

  // Tính toán dữ liệu hiển thị
  const showingFrom = (currentPage - 1) * itemsPerPage + 1;
  const showingTo = Math.min(currentPage * itemsPerPage, totalItems);

  // Fetch chapters với filter
  const fetchChapters = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching translator chapters with params:', {
        page: currentPage - 1,
        size: itemsPerPage,
        mangaId: filterManga
      });

      // Gọi API getMyChapters
      const result = await chapterService.getMyChapters(
        currentPage - 1,
        itemsPerPage,
        undefined // Không dùng keyword search
      );

      if (result) {
        let filteredChapters = result.content || [];

        // Lọc theo manga nếu có (lọc trên client vì API không hỗ trợ filter theo mangaId)
        if (filterManga && selectedFilterManga) {
          filteredChapters = filteredChapters.filter(chapter =>
            chapter.mangaId === filterManga || chapter.mangaTitle === selectedFilterManga.title
          );

          // Cập nhật lại thông tin phân trang cho filtered data
          setChapters(filteredChapters);
          setTotalPages(Math.ceil(filteredChapters.length / itemsPerPage) || 1);
          setTotalItems(filteredChapters.length);
        } else {
          setChapters(filteredChapters);
          setTotalPages(result.totalPages || 1);
          setTotalItems(result.totalElements || 0);
        }
        
        console.log('Translator chapters loaded:', {
          total: filteredChapters.length,
          totalPages: result.totalPages,
          totalElements: result.totalElements
        });
      } else {
        setChapters([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách chapter:', err);
      setError(err.message);
      setChapters([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, filterManga, selectedFilterManga]);

  // Load data khi dependencies thay đổi
  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  // Reset trang khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [filterManga]);

  // Filter manga search functions
  const handleFilterSearchChange = async (value) => {
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

  const handleSelectFilterManga = (manga) => {
    setSelectedFilterManga(manga);
    setFilterManga(manga.id);
    setFilterSearchTerm('');
    setShowFilterResults(false);
    setCurrentPage(1);
  };

  const handleClearFilterManga = () => {
    setSelectedFilterManga(null);
    setFilterManga('');
    setFilterSearchTerm('');
    setShowFilterResults(false);
    setCurrentPage(1);
  };

  // CRUD operations
  const createChapter = async (formData) => {
    setIsSubmitting(true);
    try {
      const result = await chapterService.createChapter(formData);
      if (result) {
        toast.success('Tạo chapter thành công!');
        await fetchChapters(); // Refresh data
        return result;
      }
    } catch (err) {
      console.error('Lỗi khi tạo chapter:', err);
      toast.error('Có lỗi xảy ra khi tạo chapter');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateChapter = async (id, formData) => {
    setIsSubmitting(true);
    try {
      const result = await chapterService.updateChapter(id, formData);
      if (result) {
        toast.success('Cập nhật chapter thành công!');
        await fetchChapters(); // Refresh data
        return result;
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật chapter:', err);
      toast.error('Có lỗi xảy ra khi cập nhật chapter');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteChapter = async (id) => {
    setIsSubmitting(true);
    try {
      const result = await chapterService.deleteChapter(id);
      if (result) {
        toast.success('Xóa chapter thành công!');
        await fetchChapters(); // Refresh data
        return result;
      }
    } catch (err) {
      console.error('Lỗi khi xóa chapter:', err);
      toast.error('Có lỗi xảy ra khi xóa chapter');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilterManga('');
    setSelectedFilterManga(null);
    setFilterSearchTerm('');
    setShowFilterResults(false);
    setCurrentPage(1);
  };

  return {
    // Data
    chapters,
    
    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setItemsPerPage,
    showingFrom,
    showingTo,



    // Filter
    filterManga,
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

    // Utilities
    resetFilters,
    refreshData: fetchChapters
  };
};

export default useTranslatorChapterManagement;
