import React, { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faFilter, faTimes, faSync } from '@fortawesome/free-solid-svg-icons';
import { UserResponse, UserRequest } from '../../interfaces/models/auth';
import UserTable from '../../components/admin/UserTable';
import Pagination from '../../components/common/Pagination';
import UserForm from '../../components/admin/UserForm';
import Modal from '../../components/common/Modal';
import BlockUserModal from '../../components/admin/BlockUserModal';
import { useUserManagement } from '../../hooks/useUserManagement';
import { throttle } from '../../utils/performance';

const UserManagement: React.FC = () => {
  const ITEMS_PER_PAGE = 10;

  const {
    // Data
    roles,
    currentUsers,

    // Search and filters
    searchTerm,
    setSearchTerm,
    filterRoleId,
    filterProvider,
    filterEnabled,
    handleRoleFilterChange,
    handleProviderFilterChange,
    handleStatusFilterChange,
    resetFilters,
    handleSearch,

    // Pagination
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    setPageSize,
    paginate,
    indexOfFirstItem,
    indexOfLastItem,

    // Loading states
    isLoading,
    isSubmitting,

    // CRUD operations
    saveUser,
    toggleUserStatus
  } = useUserManagement(ITEMS_PER_PAGE);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserResponse | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  // Block user modal state
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<UserResponse | null>(null);

  // Handle opening add user modal
  const handleAddUser = () => {
    setCurrentUser(undefined);
    setIsModalOpen(true);
  };

  // Handle opening edit user modal
  const handleEditUser = (user: UserResponse) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser(undefined);
  };

  // Handle form submission
  const handleSubmitForm = async (data: UserRequest) => {
    const result = await saveUser(data, currentUser);
    if (result) {
      setIsModalOpen(false);
    }
  };

  // Handle toggle user status with modal for blocking
  const handleToggleUserStatus = async (userId: string, enabled: boolean) => {
    const user = currentUsers.find(u => u.id === userId);
    if (!user) return;

    if (!enabled) {
      // Khóa tài khoản - hiển thị modal để nhập lý do
      setUserToBlock(user);
      setIsBlockModalOpen(true);
    } else {
      // Mở khóa tài khoản - thực hiện trực tiếp
      if (window.confirm(`Bạn có chắc chắn muốn mở khóa tài khoản ${user.username}?`)) {
        await toggleUserStatus(userId, enabled);
      }
    }
  };

  // Handle block user with reason
  const handleBlockUser = async (reason: string) => {
    if (!userToBlock) return;

    // Gọi API với reason (adminId sẽ được lấy từ JWT token)
    const success = await toggleUserStatus(userToBlock.id, false, reason);

    if (success) {
      setIsBlockModalOpen(false);
      setUserToBlock(null);
    }
  };

  // Handle close block modal
  const handleCloseBlockModal = () => {
    setIsBlockModalOpen(false);
    setUserToBlock(null);
  };

  // Sử dụng throttle cho phân trang để tránh gọi quá nhiều khi click nhanh
  const handlePageChange = useCallback(
    throttle((page: number) => {
      paginate(page);
    }, 300),
    [paginate]
  );

  // Xử lý tìm kiếm đơn giản không dùng debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Reset tìm kiếm
  const handleResetSearch = () => {
    setSearchTerm('');
    resetFilters();
  };

  // Xử lý toggle hiển thị bộ lọc
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Kiểm tra xem có bộ lọc nào đang được áp dụng không
  const hasActiveFilters = filterRoleId !== undefined ||
                          filterProvider !== undefined ||
                          filterEnabled !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý người dùng</h1>
        <button
          onClick={handleAddUser}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Thêm người dùng</span>
        </button>
      </div>

      {/* Modal thêm/sửa người dùng */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        size="lg"
      >
        <UserForm
          initialData={currentUser}
          roles={roles}
          onSubmit={handleSubmitForm}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Modal khóa tài khoản */}
      <BlockUserModal
        isOpen={isBlockModalOpen}
        onClose={handleCloseBlockModal}
        onConfirm={handleBlockUser}
        username={userToBlock?.username || ''}
        isLoading={isSubmitting}
      />

      {/* Tìm kiếm và bộ lọc */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-4">
        {/* Thanh tìm kiếm và nút bộ lọc */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-500" />
            </div>
            <form onSubmit={handleSearch} className="w-full">
              <input
                type="text"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Tìm kiếm theo tên hoặc email"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </form>
            {searchTerm && (
              <button
                onClick={handleResetSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                title="Xóa tìm kiếm"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>
          <button
            onClick={toggleFilters}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              hasActiveFilters || showFilters
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FontAwesomeIcon icon={faFilter} />
            <span>Bộ lọc {hasActiveFilters ? '(đang dùng)' : ''}</span>
          </button>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <FontAwesomeIcon icon={faSync} className="mr-2" />
              Đặt lại
            </button>
          )}
        </div>

        {/* Bộ lọc nâng cao */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Lọc theo vai trò */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Vai trò</label>
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={filterRoleId || ''}
                onChange={(e) => handleRoleFilterChange(e.target.value ? parseInt(e.target.value) : undefined)}
              >
                <option value="">Tất cả vai trò</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo nhà cung cấp xác thực */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Phương thức đăng nhập</label>
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={filterProvider || ''}
                onChange={(e) => handleProviderFilterChange(e.target.value || undefined)}
              >
                <option value="">Tất cả phương thức</option>
                <option value="LOCAL">LOCAL</option>
                <option value="GOOGLE">GOOGLE</option>
              </select>
            </div>

            {/* Lọc theo trạng thái */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Trạng thái</label>
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={filterEnabled === undefined ? '' : filterEnabled ? 'true' : 'false'}
                onChange={(e) => {
                  if (e.target.value === '') {
                    handleStatusFilterChange(undefined);
                  } else {
                    handleStatusFilterChange(e.target.value === 'true');
                  }
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Hoạt động</option>
                <option value="false">Bị khóa</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* User Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <UserTable
          users={currentUsers}
          onEdit={handleEditUser}
          onToggleStatus={handleToggleUserStatus}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalElements}
        showingFrom={indexOfFirstItem + 1}
        showingTo={Math.min(indexOfLastItem, totalElements)}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};

export default UserManagement;
