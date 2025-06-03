import React, { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faEye, faSync, faTimes, faImages } from '@fortawesome/free-solid-svg-icons';
import ChapterForm from '../../components/admin/ChapterForm.jsx';
import Modal from '../../components/common/Modal.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { throttle } from '../../utils/performance.js';
import useTranslatorChapterManagement from '../../hooks/useTranslatorChapterManagement.js';

const TranslatorMyChapters = () => {
  // Sử dụng custom hook
  const {
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
    deleteChapter,

    // Utilities
    resetFilters
  } = useTranslatorChapterManagement(10);

  // State cho modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(undefined);



  // Xử lý chuyển trang với throttle
  const handlePageChange = useCallback(
    throttle((page) => {
      setCurrentPage(page);
    }, 300),
    [setCurrentPage]
  );

  // Xử lý thay đổi page size
  const handlePageSizeChange = useCallback(
    (newSize) => {
      setItemsPerPage(newSize);
    },
    [setItemsPerPage]
  );

  // Xử lý mở modal thêm chapter mới
  const handleAddChapter = () => {
    setCurrentChapter(undefined);
    setIsModalOpen(true);
  };

  // Xử lý mở modal chỉnh sửa chapter
  const handleEditChapter = (chapter) => {
    setCurrentChapter(chapter);
    setIsModalOpen(true);
  };

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentChapter(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (formData) => {
    try {
      if (currentChapter && currentChapter.id) {
        // Cập nhật chapter
        await updateChapter(currentChapter.id, formData);
      } else {
        // Tạo chapter mới
        await createChapter(formData);
      }
      setIsModalOpen(false);
      setCurrentChapter(undefined);
    } catch (error) {
      console.error('Error submitting chapter form:', error);
    }
  };

  // Xử lý xóa chapter
  const handleDeleteChapter = async (chapterId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chapter này?')) {
      try {
        await deleteChapter(chapterId);
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

      {/* Lọc theo truyện */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <div className="relative">
              {selectedFilterManga ? (
                <div className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <span className="text-gray-900">{selectedFilterManga.title}</span>
                  <button
                    type="button"
                    onClick={handleClearFilterManga}
                    className="text-gray-400 hover:text-gray-500"
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Search Results */}
              {showFilterResults && filterSearchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto">
                  {filterSearchResults.map(manga => (
                    <div
                      key={manga.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelectFilterManga(manga)}
                    >
                      <div className="font-medium text-gray-900">{manga.title}</div>
                      <div className="text-sm text-gray-500">{manga.author}</div>
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
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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
                    Số trang
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
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      {selectedFilterManga ? "Không tìm thấy chương nào của truyện đã chọn" : "Không có chương nào"}
                    </td>
                  </tr>
                ) : (
                  chapters.map((chapter, index) => (
                    <tr key={chapter.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {typeof chapter.chapterNumber === 'number' ? `Chapter ${chapter.chapterNumber}` : 'Không có số chapter'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {chapter.title || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {chapter.mangaTitle || 'Không xác định'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faImages} className="text-gray-400 mr-2" />
                          <span>{chapter.pages?.length || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faEye} className="text-gray-400 mr-2" />
                          <span>{chapter.views?.toLocaleString() || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {chapter.updatedAt ? new Date(chapter.updatedAt).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditChapter(chapter)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          title="Sửa chapter"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => chapter.id && handleDeleteChapter(chapter.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa chapter"
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
        showingFrom={showingFrom}
        showingTo={showingTo}
        pageSize={itemsPerPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default TranslatorMyChapters;
