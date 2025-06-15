import { useState, useEffect, useCallback } from 'react';
import userService from '../services/user-service.js';
import roleService from '../services/role-service.js';
import { toast } from 'react-toastify';

export const useUserManagement = () => {
  // State cho danh sách người dùng
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // State cho tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
  const [filterEnabled, setFilterEnabled] = useState('');

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(0); // Spring Data JPA sử dụng 0-based indexing
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // State cho modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(undefined);

  // State cho modal khóa tài khoản
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);

  // Fetch users với phân trang và tìm kiếm
  const fetchUsers = useCallback(async (page = 0) => {
    setIsLoading(true);
    try {
      let response = null;

      // Xác định roleId từ filterRole
      const roleId = filterRole ? parseInt(filterRole) : undefined;
      const enabled = filterEnabled !== '' ? filterEnabled === 'true' : undefined;

      if (searchTerm || filterRole || filterProvider || filterEnabled !== '') {
        // Tìm kiếm với bộ lọc
        response = await userService.searchUsers(
          searchTerm,
          roleId,
          filterProvider || undefined,
          enabled,
          page,
          pageSize,
          'username'
        );
      } else {
        // Lấy tất cả người dùng
        response = await userService.getUsersPaginated(page, pageSize, 'username');
      }

      if (response) {
        setUsers(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
        setCurrentPage(response.number);
      } else {
        toast.error('Không thể lấy danh sách người dùng', { position: 'top-right' });
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng:', error);
      toast.error('Đã xảy ra lỗi khi lấy danh sách người dùng', { position: 'top-right' });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterRole, filterProvider, filterEnabled, pageSize]);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const response = await roleService.getAllRoles();
      if (response) {
        setRoles(response);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách vai trò:', error);
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  // Fetch users khi component mount hoặc khi filter thay đổi
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch roles khi component mount
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // Handle page change
  const handlePageChange = (page) => {
    // Spring Data JPA uses 0-based page indexing, but UI uses 1-based
    fetchUsers(page - 1);
  };

  // Handle filter change
  const handleFilterChange = () => {
    setCurrentPage(0);
    fetchUsers();
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterRole('');
    setFilterProvider('');
    setFilterEnabled('');
    setCurrentPage(0);
  };

  // Handle add user
  const handleAddUser = () => {
    setCurrentUser(undefined);
    setIsModalOpen(true);
  };
  // Handle edit user
  const handleEditUser = (user) => {
    console.log('handleEditUser called with user:', user);
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser(undefined);
  };  // Handle submit form
  const handleSubmitForm = async (data, userToUpdate = null) => {
    setIsSubmitting(true);
    try {
      const effectiveCurrentUser = userToUpdate || currentUser;
      console.log('handleSubmitForm - currentUser:', currentUser);
      console.log('handleSubmitForm - effectiveCurrentUser:', effectiveCurrentUser);
      console.log('handleSubmitForm - data:', data);
      
      if (effectiveCurrentUser) {
        // Update user
        console.log('Updating user with id:', effectiveCurrentUser.id);
        const response = await userService.updateUser({ ...data, id: effectiveCurrentUser.id });
        if (response) {
          setUsers(users.map(user => user.id === effectiveCurrentUser.id ? response : user));
          setIsModalOpen(false);
          return true;
        }
        return false;
      } else {
        // Create user
        console.log('Creating new user');
        const response = await userService.createUser(data);
        if (response) {
          fetchUsers(currentPage); // Refresh current page
          setIsModalOpen(false);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Lỗi khi lưu người dùng:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (username) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${username}"?`)) {
      const success = await userService.deleteUser(username);
      if (success) {
        fetchUsers(currentPage);
      }
    }
  };
  // Handle toggle user status
  const handleToggleUserStatus = (user, reason = '') => {
    setUserToToggle(user);
    if (user.enabled) {
      // Nếu đang mở khóa, hiển thị modal để nhập lý do khóa (nếu chưa có reason)
      if (!reason) {
        setIsLockModalOpen(true);
      } else {
        // Nếu đã có reason, thực hiện khóa luôn
        performToggleUserStatus(user, false, reason);
      }
    } else {
      // Nếu đang khóa, mở khóa luôn không cần lý do
      performToggleUserStatus(user, true);
    }
  };

  // Thực hiện khóa/mở khóa tài khoản
  const performToggleUserStatus = async (user, enabled, reason = '') => {
    const success = await userService.toggleUserStatus(user.id, enabled, reason);
    if (success) {
      // Cập nhật trạng thái trong danh sách
      setUsers(users.map(u => u.id === user.id ? { ...u, enabled } : u));
    }
  };

  // Handle lock modal submit
  const handleLockModalSubmit = async (reason) => {
    if (userToToggle) {
      await performToggleUserStatus(userToToggle, false, reason);
      setIsLockModalOpen(false);
      setUserToToggle(null);
    }
  };

  // Handle lock modal close
  const handleLockModalClose = () => {
    setIsLockModalOpen(false);
    setUserToToggle(null);
  };

  // Tính toán showingFrom và showingTo
  const showingFrom = totalElements > 0 ? (currentPage * pageSize) + 1 : 0;
  const showingTo = Math.min((currentPage + 1) * pageSize, totalElements);

  return {
    // Data
    users,
    roles,
    currentUser,

    // Pagination
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    setPageSize,
    showingFrom,
    showingTo,

    // Search and filters
    searchTerm,
    setSearchTerm,
    filterRole,
    setFilterRole,
    filterProvider,
    setFilterProvider,
    filterEnabled,
    setFilterEnabled,

    // Loading states
    isLoading,
    isLoadingRoles,
    isSubmitting,

    // Modal states
    isModalOpen,
    isLockModalOpen,
    userToToggle,

    // Actions
    handleSearch,
    handlePageChange,
    handleFilterChange,
    resetFilters,
    handleAddUser,
    handleEditUser,
    handleCloseModal,
    handleSubmitForm,
    handleDeleteUser,
    handleToggleUserStatus,
    handleLockModalSubmit,
    handleLockModalClose,
    fetchUsers
  };
};

export default useUserManagement;
