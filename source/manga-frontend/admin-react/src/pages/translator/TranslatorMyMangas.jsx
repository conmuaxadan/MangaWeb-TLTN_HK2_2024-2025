import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faEye, faHeart, faComment, faSync, faUndo } from '@fortawesome/free-solid-svg-icons';
import { getMangaImageUrl } from '../../utils/file-utils.js';
import MangaForm from '../../components/admin/MangaForm.jsx';
import Modal from '../../components/common/Modal.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { throttle } from '../../utils/performance.js';
import mangaService from '../../services/manga-service.js';
import { toast } from 'react-toastify';

// Manga status display names constants
const MangaStatusDisplayNames = {
  ONGOING: 'Đang tiến hành',
  COMPLETED: 'Hoàn thành',
  HIATUS: 'Tạm dừng',
  CANCELLED: 'Đã hủy'
};

const TranslatorMyMangas = () => {
  // State cho danh sách manga
  const [mangas, setMangas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab selection
  const [showDeleted, setShowDeleted] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // State cho modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentManga, setCurrentManga] = useState(undefined);

  // Fetch mangas của translator
  const fetchMyMangas = useCallback(async () => {
    setIsLoading(true);
    try {
      let response;
      if (showDeleted) {
        // Lấy danh sách truyện đã xóa
        response = await mangaService.getMyDeletedMangas(
          currentPage - 1,
          pageSize
        );
      } else {
        // Lấy danh sách truyện đang hoạt động
        response = await mangaService.getMyMangas(
          currentPage - 1,
          pageSize,
          searchTerm || undefined
        );
      }

      if (response) {
        setMangas(response.content || []);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.totalElements || 0);
      } else {
        setMangas([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Error fetching my mangas:', error);
      toast.error('Không thể tải danh sách truyện của bạn', { position: 'top-right' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, showDeleted]);

  // Load data khi component mount hoặc dependencies thay đổi
  useEffect(() => {
    fetchMyMangas();
  }, [fetchMyMangas]);

  // Xử lý tìm kiếm trực tiếp
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset về trang đầu khi search
  };

  // Xử lý chuyển trang với throttle
  const handlePageChange = useCallback(
    throttle((page) => {
      setCurrentPage(page);
    }, 300),
    []
  );

  // Xử lý thay đổi page size
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset về trang đầu
  };

  // Xử lý mở modal thêm manga mới
  const handleAddManga = () => {
    setCurrentManga(undefined);
    setIsModalOpen(true);
  };

  // Xử lý mở modal chỉnh sửa manga
  const handleEditManga = (manga) => {
    setCurrentManga(manga);
    setIsModalOpen(true);
  };

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentManga(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (formData) => {
    setIsSubmitting(true);
    try {
      let result;
      if (currentManga) {
        // Cập nhật manga
        result = await mangaService.updateManga(currentManga.id, formData);
      } else {
        // Tạo manga mới
        result = await mangaService.createManga(formData);
      }

      if (result) {
        setIsModalOpen(false);
        setCurrentManga(undefined);
        // Refresh danh sách
        await fetchMyMangas();
      }
    } catch (error) {
      console.error('Error submitting manga form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý xóa manga
  const handleDeleteManga = async (mangaId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa manga này?')) {
      try {
        const success = await mangaService.deleteManga(mangaId);
        if (success) {
          // Refresh danh sách
          await fetchMyMangas();
        }
      } catch (error) {
        console.error('Error deleting manga:', error);
      }
    }
  };

  // Xử lý khôi phục manga
  const handleRestoreManga = async (mangaId) => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục manga này?')) {
      try {
        const success = await mangaService.restoreMyManga(mangaId);
        if (success) {
          // Refresh danh sách
          await fetchMyMangas();
        }
      } catch (error) {
        console.error('Error restoring manga:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Truyện của tôi</h1>
        <div className="flex space-x-2">
          {!showDeleted && (
            <button
              onClick={handleAddManga}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Thêm truyện mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab chuyển đổi giữa manga đang hoạt động và đã xóa */}
      <div className="flex space-x-2">
        <button
          className={`px-4 py-2 rounded-md ${!showDeleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => {
            setShowDeleted(false);
            setCurrentPage(1);
          }}
        >
          Truyện đang hoạt động
        </button>
        <button
          className={`px-4 py-2 rounded-md ${showDeleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => {
            setShowDeleted(true);
            setCurrentPage(1);
          }}
        >
          Truyện đã xóa
        </button>
      </div>

      {/* Modal thêm/sửa manga */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentManga ? 'Chỉnh sửa truyện' : 'Thêm truyện mới'}
        size="xl"
      >
        <MangaForm
          initialData={currentManga}
          onSubmit={handleSubmitForm}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Tìm kiếm và Lọc - chỉ hiển thị cho tab truyện đang hoạt động */}
      {!showDeleted && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Tìm kiếm */}
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-500" />
              </div>
              <input
                type="text"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                placeholder="Tìm kiếm theo tên hoặc tác giả"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            {/* Nút đặt lại search */}
            <div className="flex items-center">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <FontAwesomeIcon icon={faSync} className="mr-2" />
                Đặt lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bảng manga */}
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
                    Truyện
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tác giả
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thể loại
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thống kê
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {showDeleted ? 'Ngày xóa' : 'Cập nhật'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mangas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      {showDeleted ? 'Không có truyện nào đã xóa' : 'Không có truyện nào'}
                    </td>
                  </tr>
                ) : (
                  mangas.map((manga) => (
                    <tr key={manga.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-24 w-16">
                            <img
                              className="h-24 w-16 rounded-md object-cover shadow-sm hover:shadow-md transition-shadow"
                              src={manga.coverUrl ? getMangaImageUrl(manga.coverUrl) : '/images/default-manga-cover.jpg'}
                              alt={manga.title}
                              onError={(e) => {
                                e.target.src = '/images/default-manga-cover.jpg';
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{manga.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{manga.chapters || 0} chương</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {manga.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex flex-wrap gap-1">
                          {manga.genres?.slice(0, 3).map((genre, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            >
                              {genre}
                            </span>
                          ))}
                          {(manga.genres?.length || 0) > 3 && (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              +{manga.genres?.length - 3 || 0}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            manga.status === 'ONGOING'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : manga.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {manga.status ? MangaStatusDisplayNames[manga.status] : 'Không xác định'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faEye} className="text-gray-400 mr-1" />
                            <span>{manga.views?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faHeart} className="text-red-400 mr-1" />
                            <span>{manga.loves?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faComment} className="text-blue-400 mr-1" />
                            <span>{manga.comments?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {showDeleted
                          ? (manga.deletedAt ? new Date(manga.deletedAt).toLocaleDateString('vi-VN') : '-')
                          : (manga.updatedAt ? new Date(manga.updatedAt).toLocaleDateString('vi-VN') : '-')
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {showDeleted ? (
                          // Nút khôi phục cho manga đã xóa
                          <button
                            onClick={() => handleRestoreManga(manga.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Khôi phục"
                          >
                            <FontAwesomeIcon icon={faUndo} />
                          </button>
                        ) : (
                          // Các nút thao tác cho manga đang hoạt động
                          <>
                            <button
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                              onClick={() => handleEditManga(manga)}
                              title="Chỉnh sửa"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              onClick={() => handleDeleteManga(manga.id)}
                              title="Xóa"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Phân trang */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalItems}
        showingFrom={(currentPage - 1) * pageSize + 1}
        showingTo={Math.min(currentPage * pageSize, totalItems)}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default TranslatorMyMangas;
