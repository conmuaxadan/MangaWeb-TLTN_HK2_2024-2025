import React, { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faEye, faHeart, faComment, faUndo, faTimes, faSync } from '@fortawesome/free-solid-svg-icons';
import {MangaManagementResponse, MangaResponse, MangaStatusDisplayNames} from '../../interfaces/models/manga';
import { getMangaImageUrl } from '../../utils/file-utils';
import MangaForm from '../../components/admin/MangaForm';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { debounce, throttle } from '../../utils/performance';
import useMangaManagement from '../../hooks/useMangaManagement';

const MangaManagement: React.FC = () => {
  const {
    // Data
    mangas,

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    pageSize,
    handlePageSizeChange,

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
    allGenres,

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
    restoreManga
  } = useMangaManagement(10); // 10 items per page

  // State cho modal
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [currentManga, setCurrentManga] = React.useState<MangaResponse | undefined>(undefined);

  // Xử lý tìm kiếm trực tiếp (không debounce)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Xử lý chuyển trang với throttle
  const handlePageChange = useCallback(
    throttle((page: number) => {
      setCurrentPage(page);
    }, 300),
    [setCurrentPage]
  );

  // Xử lý mở modal thêm manga mới
  const handleAddManga = () => {
    setCurrentManga(undefined);
    setIsModalOpen(true);
  };

  // Xử lý mở modal chỉnh sửa manga
  const handleEditManga = (manga: MangaManagementResponse) => {
    setCurrentManga(manga);
    setIsModalOpen(true);
  };

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentManga(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (formData: FormData) => {
    let result;
    if (currentManga) {
      // Cập nhật manga
      result = await updateManga(currentManga.id, formData);
    } else {
      // Tạo manga mới
      result = await createManga(formData);
    }

    if (result) {
      setIsModalOpen(false);
    }
  };

  // Xử lý xóa manga
  const handleDeleteManga = async (mangaId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa manga này?')) {
      await deleteManga(mangaId);
    }
  };

  // Xử lý khôi phục manga
  const handleRestoreManga = async (mangaId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục manga này?')) {
      await restoreManga(mangaId);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || filterGenre || filterStatus || filterYear;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý truyện</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleAddManga}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Thêm truyện mới</span>
          </button>
        </div>
      </div>

      {/* Tab chuyển đổi giữa manga đang hoạt động và đã xóa */}
      <div className="flex space-x-2">
        <button
          className={`px-4 py-2 rounded-md ${!showDeleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setShowDeleted(false)}
        >
          Truyện đang hoạt động
        </button>
        <button
          className={`px-4 py-2 rounded-md ${showDeleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setShowDeleted(true)}
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
              placeholder="Tìm kiếm theo tên hoặc tác giả"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {/* Lọc theo thể loại */}
          <div className="w-auto min-w-[160px]">
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
            >
              <option value="">Tất cả thể loại</option>
              {allGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo trạng thái */}
          <div className="w-auto min-w-[160px]">
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ONGOING">Đang tiến hành</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="PAUSED">Tạm ngưng</option>
            </select>
          </div>

          {/* Lọc theo năm */}
          <div className="w-auto min-w-[140px]">
            <input
              type="number"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="Năm phát hành"
              value={filterYear || ''}
              onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : undefined)}
              min="1900"
              max={new Date().getFullYear()}
            />
          </div>

          {/* Nút đặt lại filters */}
          <div className="flex items-center">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <FontAwesomeIcon icon={faSync} className="mr-2" />
              Đặt lại
            </button>
          </div>
        </div>
      </div>

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
                    Cập nhật
                  </th>
                  {showDeleted && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thông tin xóa
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mangas.length === 0 ? (
                  <tr>
                    <td colSpan={showDeleted ? 8 : 7} className="px-6 py-4 text-center text-gray-500">
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
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/default-manga-cover.jpg';
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
                        {manga.updatedAt ? new Date(manga.updatedAt).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      {showDeleted && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <div>
                            <div>Xóa lúc: {manga.deletedAt ? new Date(manga.deletedAt).toLocaleString('vi-VN') : 'N/A'}</div>
                            <div>Người xóa: {manga.deletedBy || 'N/A'}</div>
                          </div>
                        </td>
                      )}
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

export default MangaManagement;
