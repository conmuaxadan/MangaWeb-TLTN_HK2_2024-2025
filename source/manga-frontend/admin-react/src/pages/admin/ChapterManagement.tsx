import React, { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faEye, faImages, faSearch, faTimes, faSync } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { ChapterResponse } from '../../interfaces/models/manga';
import ChapterForm from '../../components/admin/ChapterForm';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import useChapterManagement from '../../hooks/useChapterManagement';
import { throttle } from '../../utils/performance';

const ChapterManagement: React.FC = () => {
  // Sử dụng custom hook
  const {
    // Data
    currentChapters,

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    showingFrom,
    showingTo,
    totalItems,
    itemsPerPage,
    setItemsPerPage,

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

    // CRUD operations
    createChapter,
    updateChapter,
    deleteChapter
  } = useChapterManagement(10); // Bắt đầu với 10 items per page

  // State cho modal và form
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentChapter, setCurrentChapter] = useState<ChapterResponse | undefined>(undefined);
  const [modalTitle, setModalTitle] = useState<string>('Thêm chapter mới');

  // Xử lý phân trang với throttle
  const handlePageChange = useCallback(
    throttle((page: number) => {
      setCurrentPage(page);
    }, 300),
    [setCurrentPage]
  );

  // Xử lý thay đổi kích thước trang
  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setItemsPerPage(newSize);
    },
    [setItemsPerPage]
  );

  // Xử lý mở modal thêm chapter mới
  const handleAddChapter = () => {
    setCurrentChapter(undefined);
    setModalTitle('Thêm chapter mới');
    setIsModalOpen(true);
  };

  // Xử lý mở modal chỉnh sửa chapter
  const handleEditChapter = (chapter: ChapterResponse) => {
    setCurrentChapter(chapter);
    setModalTitle(`Chỉnh sửa chapter ${chapter.chapterNumber}`);
    setIsModalOpen(true);
  };

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentChapter(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (formData: FormData) => {
    try {
      let result;

      if (currentChapter?.id) {
        // Cập nhật chapter
        result = await updateChapter(currentChapter.id, formData);
      } else {
        // Tạo chapter mới
        result = await createChapter(formData);
      }

      if (result) {
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Lỗi khi lưu chapter:', error);
      toast.error('Đã xảy ra lỗi khi lưu chapter. Vui lòng thử lại.');
    }
  };

  // Xử lý xóa chapter
  const handleDeleteChapter = async (chapter: ChapterResponse) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa chapter ${chapter.title}"?`)) {
      if (chapter.id === undefined) {
        console.error('Không thể xóa chapter');
        return;
      }
      await deleteChapter(chapter.id);
    }
  };

  // Debug logs
  console.log('ChapterManagement render:', {
    filterManga,
    selectedFilterManga: selectedFilterManga?.title || 'None',
    currentChapters: currentChapters?.length || 0,
    itemsPerPage
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý chương</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleAddChapter}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Thêm chapter mới</span>
          </button>
        </div>
      </div>

      {/* Modal thêm/sửa chapter */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalTitle}
        size="xl"
      >
        <ChapterForm
          initialData={currentChapter}
          onSubmit={handleSubmitForm}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Lọc theo truyện */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <div className="relative">
              {selectedFilterManga ? (
                <div className="flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                  <span className="text-gray-900 dark:text-white">{selectedFilterManga.title}</span>
                  <button
                    type="button"
                    onClick={handleClearFilterManga}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm truyện để lọc..."
                    value={filterSearchTerm}
                    onChange={(e) => handleFilterSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              {/* Search Results */}
              {showFilterResults && filterSearchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-md max-h-60 overflow-auto">
                  {filterSearchResults.map(manga => (
                    <div
                      key={manga.id}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                      onClick={() => handleSelectFilterManga(manga)}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{manga.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{manga.author}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Nút đặt lại filter */}
          <div>
            <button
              onClick={handleClearFilterManga}
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Chương
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Truyện
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Số trang
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Lượt xem
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cập nhật
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentChapters.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      {filterManga ? "Không tìm thấy chapter nào của truyện đã chọn" : "Không có chapter nào trong hệ thống"}
                    </td>
                  </tr>
                ) : (
                  currentChapters.map((chapter) => (
                    <tr key={chapter.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {typeof chapter.chapterNumber === 'number' ? `Chapter ${chapter.chapterNumber}` : 'Không có số chapter'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {chapter.title || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {chapter.mangaTitle || 'Không xác định'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faImages} className="text-gray-400 mr-2" />
                          <span>{chapter.pages?.length || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faEye} className="text-gray-400 mr-2" />
                          <span>{chapter.views?.toLocaleString() || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {chapter.updatedAt ? new Date(chapter.updatedAt).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditChapter(chapter)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                          title="Sửa chapter"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDeleteChapter(chapter)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Xóa chapter"
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
        showingFrom={showingFrom}
        showingTo={showingTo}
        pageSize={itemsPerPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default ChapterManagement;

