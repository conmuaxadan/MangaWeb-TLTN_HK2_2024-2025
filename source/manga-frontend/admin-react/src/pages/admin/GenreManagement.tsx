import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { GenreResponse, GenreRequest } from '../../interfaces/models/genre';
import genreService from '../../services/genre-service';
import Modal from '../../components/common/Modal';
import GenreForm from '../../components/admin/GenreForm';
import Pagination from '../../components/common/Pagination';

const GenreManagement: React.FC = () => {
  // State cho danh sách thể loại
  const [genres, setGenres] = useState<GenreResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // State cho modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentGenre, setCurrentGenre] = useState<GenreResponse | undefined>(undefined);

  // Xử lý tìm kiếm (danh sách đã được sắp xếp theo bảng chữ cái từ API)
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
        console.log('Danh sách thể loại nhận được trong component:', response);
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



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý thể loại</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          onClick={handleAddGenre}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Thêm thể loại</span>
        </button>
      </div>

      {/* Modal thêm/sửa thể loại */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentGenre ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}
        size="md"
      >
        <GenreForm
          initialData={currentGenre}
          onSubmit={handleSubmitForm}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Tìm kiếm */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-gray-500" />
          </div>
          <input
            type="text"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Tìm kiếm thể loại"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bảng thể loại */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên thể loại
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentGenres.map((genre) => (
                <tr key={genre.id || genre.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {genre.id !== undefined ? genre.id : 'Không có ID'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {genre.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {genre.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditGenre(genre)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => genre.id && handleDeleteGenre(genre.id, genre.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
              {currentGenres.length === 0 && filteredGenres.length > 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    Không tìm thấy thể loại nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Phân trang */}
      {filteredGenres.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={paginate}
          totalItems={filteredGenres.length}
          // itemsPerPage={itemsPerPage}
          showingFrom={indexOfFirstItem + 1}
          showingTo={indexOfLastItem > filteredGenres.length ? filteredGenres.length : indexOfLastItem}
        />
      )}
    </div>
  );
};

export default GenreManagement;
