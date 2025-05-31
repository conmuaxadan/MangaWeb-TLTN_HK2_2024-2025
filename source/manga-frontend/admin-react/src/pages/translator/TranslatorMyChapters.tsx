import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faEye, faSync } from '@fortawesome/free-solid-svg-icons';
import { ChapterResponse } from '../../interfaces/models/manga';
import ChapterForm from '../../components/admin/ChapterForm';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { throttle } from '../../utils/performance';
import chapterService from '../../services/chapter-service';
import mangaService from '../../services/manga-service';
import { toast } from 'react-toastify';

const TranslatorMyChapters: React.FC = () => {
  // State cho danh sách chapter
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // State cho modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentChapter, setCurrentChapter] = useState<ChapterResponse | undefined>(undefined);

  // Fetch chapters của translator
  const fetchMyChapters = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await chapterService.getMyChapters(
        currentPage - 1,
        pageSize,
        searchTerm || undefined
      );

      if (response) {
        setChapters(response.content || []);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.totalElements || 0);
      } else {
        setChapters([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Error fetching my chapters:', error);
      toast.error('Không thể tải danh sách chương của bạn', { position: 'top-right' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchTerm]);

  // Load data khi component mount hoặc dependencies thay đổi
  useEffect(() => {
    fetchMyChapters();
  }, [fetchMyChapters]);

  // Xử lý tìm kiếm trực tiếp
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset về trang đầu khi search
  };

  // Xử lý chuyển trang với throttle
  const handlePageChange = useCallback(
    throttle((page: number) => {
      setCurrentPage(page);
    }, 300),
    []
  );

  // Xử lý thay đổi page size
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset về trang đầu
  };

  // Xử lý mở modal thêm chapter mới
  const handleAddChapter = () => {
    setCurrentChapter(undefined);
    setIsModalOpen(true);
  };

  // Xử lý mở modal chỉnh sửa chapter
  const handleEditChapter = (chapter: ChapterResponse) => {
    setCurrentChapter(chapter);
    setIsModalOpen(true);
  };

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentChapter(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      let result;
      if (currentChapter && currentChapter.id) {
        // Cập nhật chapter
        result = await mangaService.updateChapter(currentChapter.id, formData);
      } else {
        // Tạo chapter mới
        result = await mangaService.createChapter(formData);
      }

      if (result) {
        setIsModalOpen(false);
        setCurrentChapter(undefined);
        // Refresh danh sách
        await fetchMyChapters();
      }
    } catch (error) {
      console.error('Error submitting chapter form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý xóa chapter
  const handleDeleteChapter = async (chapterId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chapter này?')) {
      try {
        const success = await mangaService.deleteChapter(chapterId);
        if (success) {
          // Refresh danh sách
          await fetchMyChapters();
        }
      } catch (error) {
        console.error('Error deleting chapter:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Chương của tôi</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleAddChapter}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Thêm chương mới</span>
          </button>
        </div>
      </div>

      {/* Modal thêm/sửa chapter */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentChapter ? 'Chỉnh sửa chương' : 'Thêm chương mới'}
        size="xl"
      >
        <ChapterForm
          initialData={currentChapter}
          onSubmit={handleSubmitForm}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Tìm kiếm và Lọc */}
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
              placeholder="Tìm kiếm theo tên chương"
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

      {/* Bảng chapter */}
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
                    Chương
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Truyện
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lượt xem
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cập nhật
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chapters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Không có chương nào
                    </td>
                  </tr>
                ) : (
                  chapters.map((chapter, index) => (
                    <tr key={chapter.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Chương {chapter.chapterNumber}: {chapter.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {chapter.mangaTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faEye} className="text-gray-400 mr-1" />
                          <span>{chapter.views?.toLocaleString() || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {chapter.updatedAt ? new Date(chapter.updatedAt).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                          onClick={() => handleEditChapter(chapter)}
                          title="Chỉnh sửa"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => chapter.id && handleDeleteChapter(chapter.id)}
                          title="Xóa"
                          disabled={!chapter.id}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
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

export default TranslatorMyChapters;
