import { useState, useEffect } from 'react';
import { GenreResponse, GenreRequest } from '../interfaces/models/genre';
import genreService from '../services/genre-service';

const useGenreManagement = () => {
  // State cho danh sách thể loại
  const [genres, setGenres] = useState<GenreResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State cho modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentGenre, setCurrentGenre] = useState<GenreResponse | undefined>(undefined);

  // Xử lý tìm kiếm
  const filteredGenres = genres.filter(genre =>
    genre.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (genre.description && genre.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Tính toán phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGenres = filteredGenres.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredGenres.length / itemsPerPage);

  // Xử lý chuyển trang
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Xử lý thay đổi kích thước trang
  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1); // Reset về trang đầu tiên
  };

  // Load danh sách thể loại
  useEffect(() => {
    fetchGenres();
  }, []);

  // Hàm lấy danh sách thể loại
  const fetchGenres = async () => {
    setIsLoading(true);
    try {
      const response = await genreService.getAllGenres();
      if (response) {
        console.log('Danh sách thể loại nhận được trong hook:', response);
        setGenres(response);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thể loại:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý xóa thể loại
  const handleDeleteGenre = async (id: number, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa thể loại "${name}"?`)) {
      try {
        const success = await genreService.deleteGenreById(id);
        if (success) {
          setGenres(genres.filter(genre => genre.id !== id));
        }
      } catch (error) {
        console.error(`Lỗi khi xóa thể loại ${name} (ID: ${id}):`, error);
      }
    }
  };

  // Xử lý mở modal thêm mới
  const handleAddGenre = () => {
    setCurrentGenre(undefined);
    setIsModalOpen(true);
  };

  // Xử lý mở modal chỉnh sửa
  const handleEditGenre = (genre: GenreResponse) => {
    if (!genre.id) {
      console.error('Không thể chỉnh sửa thể loại không có ID');
      return;
    }
    setCurrentGenre(genre);
    setIsModalOpen(true);
  };

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentGenre(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (data: GenreRequest) => {
    setIsSubmitting(true);
    try {
      if (currentGenre?.id) {
        // Cập nhật thể loại
        const response = await genreService.updateGenreById(currentGenre.id, data);
        if (response) {
          setGenres(
            genres.map(genre =>
              genre.id === currentGenre.id
                ? response
                : genre
            )
          );
          setIsModalOpen(false);
        }
      } else {
        // Tạo thể loại mới
        // Kiểm tra trùng tên
        if (genres.some(genre => genre.name.toLowerCase() === data.name.toLowerCase())) {
          alert('Thể loại này đã tồn tại');
          setIsSubmitting(false);
          return;
        }

        const response = await genreService.createGenre(data);
        if (response) {
          setGenres([...genres, response]);
          setIsModalOpen(false);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu thể loại:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý reset tìm kiếm
  const resetSearch = () => {
    setSearchTerm('');
  };

  return {
    // Data
    genres,
    filteredGenres,
    currentGenres,
    currentGenre,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,

    // State
    isLoading,
    isSubmitting,
    isModalOpen,
    searchTerm,
    currentPage,
    itemsPerPage,

    // Actions
    setSearchTerm,
    handleAddGenre,
    handleEditGenre,
    handleDeleteGenre,
    handleCloseModal,
    handleSubmitForm,
    paginate,
    handlePageSizeChange,
    resetSearch,
    fetchGenres
  };
};

export default useGenreManagement;
