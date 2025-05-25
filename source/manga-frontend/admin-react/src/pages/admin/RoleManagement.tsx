import React, { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faRefresh, faSync } from '@fortawesome/free-solid-svg-icons';
import { RoleResponse, RoleRequest } from '../../interfaces/models/auth';
import RoleTable from '../../components/admin/RoleTable';
import RoleForm from '../../components/admin/RoleForm';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { useRoleManagement } from '../../hooks/useRoleManagement';
import { toast } from 'react-toastify';
import { debounce, throttle } from '../../utils/performance';

const RoleManagement: React.FC = () => {
  const ITEMS_PER_PAGE = 10;

  const {
    // Data
    permissions,
    currentRoles,
    filteredRoles,

    // Search
    searchTerm,
    setSearchTerm,
    resetSearch,

    // Pagination
    currentPage,
    totalPages,
    pageSize,
    paginate,
    handlePageSizeChange,
    indexOfFirstItem,
    indexOfLastItem,

    // Loading states
    isLoading,
    isSubmitting,

    // CRUD operations
    getRoleDetails,
    saveRole,
    deleteRole
  } = useRoleManagement(ITEMS_PER_PAGE);

  // State cho modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleResponse | undefined>(undefined);

  // Sử dụng debounce cho tìm kiếm theo thời gian thực
  const handleSearchChange = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
    }, 400),
    [setSearchTerm]
  );

  // Sử dụng throttle cho phân trang
  const handlePageChange = useCallback(
    throttle((page: number) => {
      paginate(page);
    }, 300),
    [paginate]
  );

  // Xử lý mở modal thêm vai trò
  const handleAddRole = () => {
    setCurrentRole(undefined);
    setIsModalOpen(true);
  };

  // Xử lý mở modal sửa vai trò
  const handleEditRole = async (role: RoleResponse) => {
    try {
      const roleDetail = await getRoleDetails(role);
      if (roleDetail) {
        setCurrentRole(roleDetail);
        setIsModalOpen(true);
      }
    } catch (error) {
      toast.error(`Không thể tải thông tin chi tiết vai trò ${role.name}`, { position: "top-right" });
    }
  };

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentRole(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (data: RoleRequest) => {
    const result = await saveRole(data, currentRole);
    if (result) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý vai trò</h1>
        <button
          onClick={handleAddRole}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Thêm vai trò</span>
        </button>
      </div>

      {/* Modal thêm/sửa vai trò */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentRole ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}
        size="lg"
      >
        <RoleForm
          initialData={currentRole}
          permissions={permissions}
          onSubmit={handleSubmitForm}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Tìm kiếm */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Tìm kiếm vai trò..."
              defaultValue={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
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

      {/* Bảng vai trò */}
      <RoleTable
        roles={currentRoles}
        onEdit={handleEditRole}
        onDelete={deleteRole}
        loading={isLoading}
      />

      {/* Phân trang */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={filteredRoles.length}
        showingFrom={indexOfFirstItem + 1}
        showingTo={indexOfLastItem > filteredRoles.length ? filteredRoles.length : indexOfLastItem}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default RoleManagement;
