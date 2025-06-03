import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faSync } from '@fortawesome/free-solid-svg-icons';
import Modal from '../../components/common/Modal.jsx';
import GenreForm from '../../components/admin/GenreForm.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import useGenreManagement from '../../hooks/useGenreManagement.js';

const GenreManagement = () => {
  const {
    // Data
    currentGenres,
    currentGenre,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    filteredGenres,

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
    resetSearch
  } = useGenreManagement();

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
        <div className="flex gap-4">
          <div className="relative flex-1">
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

          <button
            onClick={resetSearch}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <FontAwesomeIcon icon={faSync} className="mr-2" />
            Đặt lại
          </button>
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={paginate}
        totalItems={filteredGenres.length}
        showingFrom={indexOfFirstItem + 1}
        showingTo={indexOfLastItem > filteredGenres.length ? filteredGenres.length : indexOfLastItem}
        pageSize={itemsPerPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default GenreManagement;
