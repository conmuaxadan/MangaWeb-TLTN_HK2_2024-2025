import { useState, useEffect, useCallback } from 'react';
import {MangaManagementResponse, MangaResponse} from '../interfaces/models/manga';
import mangaService from '../services/manga-service';
import { toast } from 'react-toastify';

export const useMangaManagement = (itemsPerPage: number = 10) => {
  // State cho danh sách manga
  const [mangas, setMangas] = useState<MangaManagementResponse[]>([]);
  const [deletedMangas] = useState<MangaResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDeleted, setShowDeleted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State cho tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear] = useState<number | undefined>(undefined);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  // Danh sách tất cả các thể loại từ dữ liệu manga
  const allGenres = useCallback(() => {
    return Array.from(
      new Set(mangas.flatMap(manga => manga.genres || []))
    ).sort();
  }, [mangas]);

  // Load danh sách manga khi component mount hoặc khi currentPage, pageSize hoặc showDeleted thay đổi
  useEffect(() => {
    fetchMangas();
  }, [currentPage, pageSize, showDeleted]);

  // Reset về trang đầu tiên khi thay đổi tìm kiếm hoặc lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGenre, filterStatus, filterYear, showDeleted]);

  // Fetch lại data khi filter thay đổi
  useEffect(() => {
    if (currentPage === 1) {
      fetchMangas();
    }
  }, [searchTerm, filterGenre, filterStatus, filterYear]);

  // Hàm lấy danh sách manga
  const fetchMangas = async () => {
    setIsLoading(true);
    try {
      const pageIndex = currentPage - 1; // API sử dụng 0-based index

      // Chuẩn bị filter parameters
      const keyword = searchTerm.trim() || undefined;
      const genreName = filterGenre || undefined;
      const status = filterStatus || undefined;
      const yearOfRelease = filterYear || undefined;

      if (!showDeleted) {
        // Lấy danh sách manga chưa bị xóa (với phân trang và filter)
        const activeResponse = await mangaService.getAllMangas(
          pageIndex,
          pageSize,
          keyword,
          genreName,
          status,
          yearOfRelease
        );
        if (activeResponse) {
          setMangas(activeResponse.content || []);
          setTotalItems(activeResponse.totalElements || 0);
          setTotalPages(activeResponse.totalPages || 1);
        } else {
          toast.error('Không thể tải danh sách truyện', { position: 'top-right' });
        }
      } else {
        // Lấy danh sách manga đã bị xóa (với phân trang và filter)
        const deletedResponse = await mangaService.getAllDeletedMangas(
          pageIndex,
          pageSize,
          keyword,
          genreName,
          status,
          yearOfRelease
        );
        if (deletedResponse) {
          setMangas(deletedResponse.content || []);
          setTotalItems(deletedResponse.totalElements || 0);
          setTotalPages(deletedResponse.totalPages || 1);
        } else {
          toast.error('Không thể tải danh sách truyện đã xóa', { position: 'top-right' });
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách manga:', error);
      toast.error('Đã xảy ra lỗi khi tải dữ liệu', { position: 'top-right' });
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy danh sách manga hiện tại (đã được filter và phân trang từ backend)
  const currentMangas = mangas;

  // Thêm manga mới
  const createManga = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const newManga = await mangaService.createManga(formData);
      if (newManga) {
        setMangas(prev => {
          return [...prev, {...newManga}];
        });
        toast.success('Thêm truyện thành công', { position: 'top-right' });
        return newManga;
      }
      return null;
    } catch (error) {
      console.error('Lỗi khi thêm truyện mới:', error);
      toast.error('Có lỗi xảy ra khi thêm truyện mới', { position: 'top-right' });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật manga
  const updateManga = async (mangaId: string, formData: FormData) => {
    setIsSubmitting(true);
    try {
      const updatedManga = await mangaService.updateManga(mangaId, formData);
      if (updatedManga) {
        setMangas(mangas.map(manga => manga.id === updatedManga.id ? updatedManga : manga));
        return updatedManga;
      }
      return null;
    } catch (error) {
      console.error(`Lỗi khi cập nhật truyện ID ${mangaId}:`, error);
      toast.error('Có lỗi xảy ra khi cập nhật truyện', { position: 'top-right' });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa manga
  const deleteManga = async (mangaId: string) => {
    try {
      const success = await mangaService.deleteManga(mangaId);
      if (success) {
        await fetchMangas(); // Tải lại danh sách sau khi xóa
        toast.success('Xóa truyện thành công', { position: 'top-right' });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Lỗi khi xóa truyện ID ${mangaId}:`, error);
      toast.error('Có lỗi xảy ra khi xóa truyện', { position: 'top-right' });
      return false;
    }
  };

  // Khôi phục manga
  const restoreManga = async (mangaId: string) => {
    try {
      const restoredManga = await mangaService.restoreManga(mangaId);
      if (restoredManga) {
        await fetchMangas(); // Tải lại danh sách sau khi khôi phục
        toast.success('Khôi phục truyện thành công', { position: 'top-right' });
        return restoredManga;
      }
      return null;
    } catch (error) {
      console.error(`Lỗi khi khôi phục truyện ID ${mangaId}:`, error);
      toast.error('Có lỗi xảy ra khi khôi phục truyện', { position: 'top-right' });
      return null;
    }
  };

  // Tính toán giá trị cho pagination
  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;

  // Làm mới danh sách
  const refreshMangas = () => {
    fetchMangas();
  };

  // Reset tìm kiếm và lọc
  const resetFilters = () => {
    setSearchTerm('');
    setFilterGenre('');
    setFilterStatus('');
    setFilterYear(undefined);
    setCurrentPage(1);
  };

  // Xử lý thay đổi kích thước trang
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset về trang đầu tiên
  };

  return {
    // Data
    mangas,
    deletedMangas,
    currentMangas,
    allGenres: allGenres(),

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    pageSize,
    handlePageSizeChange,
    indexOfFirstItem,
    indexOfLastItem,

    // Filters
    searchTerm,
    setSearchTerm,
    filterGenre,
    setFilterGenre,
    filterStatus,
    setFilterStatus,
    filterYear,
    setFilterYear,
    resetFilters,

    // Tab selection
    showDeleted,
    setShowDeleted,

    // Loading states
    isLoading,
    isSubmitting,

    // CRUD operations
    createManga,
    updateManga,
    deleteManga,
    restoreManga,
    refreshMangas
  };
};

export default useMangaManagement;
