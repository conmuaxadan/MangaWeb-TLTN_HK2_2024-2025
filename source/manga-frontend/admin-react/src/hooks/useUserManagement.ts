import { useState, useEffect, useCallback } from 'react';
import { UserResponse, UserRequest, RoleResponse } from '../interfaces/models/auth';
import userService from '../services/user-service';
import roleService from '../services/role-service';
import { toast } from 'react-toastify';

export const useUserManagement = (itemsPerPage: number = 10) => {
  // State for users and roles
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [roles, setRoles] = useState<RoleResponse[]>([]);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoleId, setFilterRoleId] = useState<number | undefined>(undefined);
  const [filterProvider, setFilterProvider] = useState<string | undefined>(undefined);
  const [filterEnabled, setFilterEnabled] = useState<boolean | undefined>(undefined);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  // State for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users with pagination, search and filters
  const fetchUsers = useCallback(async (page: number = 0) => {
    setIsLoading(true);
    try {
      // Sử dụng API searchUsers đã được nâng cấp để hỗ trợ các bộ lọc
      const response = await userService.searchUsers(
        searchTerm,
        filterRoleId,
        filterProvider,
        filterEnabled,
        page,
        pageSize,
        'username'
      );

      if (response) {
        setUsers(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
        setCurrentPage(response.number + 1); // Spring Data JPA sử dụng page bắt đầu từ 0, UI sử dụng từ 1
      } else {
        toast.error('Không thể tải danh sách người dùng.', { position: "top-right" });
      }
    } catch (error) {
      console.error('Lỗi tải danh sách người dùng:', error);
      toast.error('Đã xảy ra lỗi khi tải danh sách người dùng.', { position: "top-right" });
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, searchTerm, filterRoleId, filterProvider, filterEnabled]);

  // Initialize data
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers]);

  // Fetch roles list
  const fetchRoles = useCallback(async () => {
    try {
      const response = await roleService.getAllRoles();
      if (response) {
        setRoles(response);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách vai trò:', error);
    }
  }, []);

  // The filtered users are handled by server
  const currentUsers = users;

  // Handle page change - now using 1-based indexing for UI and converting to 0-based for API
  const paginate = (pageNumber: number) => {
    fetchUsers(pageNumber - 1); // Trừ 1 để chuyển từ UI (1-based) sang API (0-based)
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset về trang đầu tiên
    fetchUsers(0); // Fetch lại với trang đầu tiên
  };

  // Calculate for displaying in UI
  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;

  // Handle filter changes
  const handleRoleFilterChange = (roleId: number | undefined) => {
    setFilterRoleId(roleId);
    setCurrentPage(1);
    // fetchUsers will be triggered by the effect that depends on filterRoleId
  };

  const handleProviderFilterChange = (provider: string | undefined) => {
    setFilterProvider(provider);
    setCurrentPage(1);
    // fetchUsers will be triggered by the effect that depends on filterProvider
  };

  const handleStatusFilterChange = (enabled: boolean | undefined) => {
    setFilterEnabled(enabled);
    setCurrentPage(1);
    // fetchUsers will be triggered by the effect that depends on filterEnabled
  };

  // Handle save user (create or update)
  const saveUser = async (data: UserRequest, currentUser?: UserResponse) => {
    setIsSubmitting(true);
    try {
      let response: UserResponse | null = null;

      if (currentUser) {
        // Update existing user
        const updateData = {
          ...data,
          id: currentUser.id,
          email: currentUser.email,
          username: currentUser.username
        };

        response = await userService.updateUser(updateData);
      } else {
        // Create new user
        response = await userService.createUser(data);
      }

      if (response) {
        // Refresh the user list
        fetchUsers(currentPage - 1);
        toast.success(`Người dùng ${currentUser ? 'đã được cập nhật' : 'đã được tạo'} thành công`, { position: "top-right" });
        return response;
      }
      return null;
    } catch (error: any) {
      console.error('Lỗi khi lưu người dùng:', error);

      // Display specific error message based on error code
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;

      if (errorCode === 1108 || errorCode === 1100) {
        toast.error("Tên đăng nhập đã tồn tại, vui lòng chọn tên khác", { position: "top-right" });
      } else if (errorCode === 1107) {
        toast.error("Email đã tồn tại, vui lòng sử dụng email khác", { position: "top-right" });
      } else {
        toast.error(errorMessage || "Đã xảy ra lỗi khi lưu người dùng", { position: "top-right" });
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggle user status
  const toggleUserStatus = async (userId: string, enabled: boolean, reason?: string) => {
    try {
      const updatedUser = await userService.toggleUserStatus(userId, enabled, reason);
      if (updatedUser) {
        // Update the user in the list
        setUsers(users.map(user => user.id === userId ? { ...user, enabled: enabled } : user));
        toast.success(`Đã ${enabled ? 'mở khóa' : 'khóa'} người dùng thành công`, { position: "top-right" });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Lỗi ${enabled ? 'mở khóa' : 'khóa'} người dùng:`, error);
      toast.error(`Không thể ${enabled ? 'mở khóa' : 'khóa'} người dùng`, { position: "top-right" });
      return false;
    }
  };

  // Reset all filters and search
  const resetFilters = () => {
    setSearchTerm('');
    setFilterRoleId(undefined);
    setFilterProvider(undefined);
    setFilterEnabled(undefined);
    setCurrentPage(1);
    // fetchUsers will be triggered by the effect that depends on filter states
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(0); // Tìm kiếm từ trang đầu tiên
  };

  return {
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
    setPageSize: handlePageSizeChange,
    paginate,
    indexOfFirstItem,
    indexOfLastItem,

    // Loading states
    isLoading,
    isSubmitting,

    // CRUD operations
    saveUser,
    toggleUserStatus
  };
};
