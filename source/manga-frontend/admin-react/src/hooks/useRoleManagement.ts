import { useState, useEffect, useCallback } from 'react';
import { RoleResponse, RoleRequest, PermissionResponse } from '../interfaces/models/auth';
import roleService from '../services/role-service';
import { toast } from 'react-toastify';

export const useRoleManagement = (itemsPerPage: number = 10) => {
  // State cho danh sách vai trò và quyền hạn
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  // State cho loading
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hàm lấy danh sách vai trò
  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await roleService.getAllRoles();
      if (response) {
        setRoles(response);
        setTotalPages(Math.ceil(response.length / pageSize));
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách vai trò:', error);
      toast.error('Không thể tải danh sách vai trò. Vui lòng thử lại sau.', { position: "top-right" });
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Hàm lấy danh sách quyền hạn
  const fetchPermissions = useCallback(async () => {
    try {
      const response = await roleService.getAllPermissions();
      if (response) {
        setPermissions(response);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách quyền hạn:', error);
      toast.error('Không thể tải danh sách quyền hạn.', { position: "top-right" });
    }
  }, []);

  // Load danh sách vai trò và quyền hạn khi component mount
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  // Xử lý tìm kiếm
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Tính toán phân trang
  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentRoles = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);

  // Xử lý chuyển trang
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Xử lý thay đổi kích thước trang
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset về trang đầu tiên
    setTotalPages(Math.ceil(filteredRoles.length / newSize));
  };

  // Lấy thông tin chi tiết của vai trò
  const getRoleDetails = async (role: RoleResponse): Promise<RoleResponse | null> => {
    try {
      if (role.id) {
        const roleDetail = await roleService.getRoleById(role.id);
        return roleDetail;
      } else {
        // Fallback to using name if ID is not available
        const roleDetail = await roleService.getRoleByName(role.name);
        return roleDetail;
      }
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin chi tiết vai trò ${role.name}:`, error);
      toast.error(`Không thể lấy thông tin chi tiết vai trò ${role.name}.`, { position: "top-right" });
      return null;
    }
  };

  // Xử lý submit form (tạo hoặc cập nhật vai trò)
  const saveRole = async (data: RoleRequest, currentRole?: RoleResponse) => {
    setIsSubmitting(true);
    try {
      if (currentRole) {
        // Cập nhật vai trò
        const response = await roleService.updateRole(currentRole.id || 0, currentRole.name, data);
        if (response) {
          // Cập nhật danh sách vai trò
          setRoles(roles.map(role => role.id === response.id ? response : role));
          toast.success(`Vai trò ${response.name} đã được cập nhật thành công.`, { position: "top-right" });
          return response;
        }
      } else {
        // Tạo vai trò mới
        const response = await roleService.createRole(data);
        if (response) {
          // Thêm vai trò mới vào danh sách
          setRoles([...roles, response]);
          toast.success(`Vai trò ${response.name} đã được tạo thành công.`, { position: "top-right" });
          return response;
        }
      }
      return null;
    } catch (error: any) {
      console.error('Lỗi khi lưu vai trò:', error);

      // Hiển thị thông báo lỗi cụ thể dựa trên mã lỗi
      const errorMessage = error?.response?.data?.message || "Đã xảy ra lỗi khi lưu vai trò.";
      toast.error(errorMessage, { position: "top-right" });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý xóa vai trò
  const deleteRole = async (roleId: number, roleName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vai trò ${roleName}?`)) {
      try {
        const success = await roleService.deleteRole(roleId, roleName);
        if (success) {
          // Xóa vai trò khỏi danh sách
          setRoles(roles.filter(role => role.id !== roleId));
          toast.success(`Vai trò ${roleName} đã được xóa thành công.`, { position: "top-right" });

          // Xử lý phân trang khi xóa role trên trang cuối cùng
          const newFilteredLength = filteredRoles.length - 1;
          const newTotalPages = Math.ceil(newFilteredLength / pageSize);
          setTotalPages(newTotalPages);

          if (newFilteredLength % pageSize === 0 && currentPage === totalPages && totalPages > 1) {
            setCurrentPage(currentPage - 1);
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error(`Lỗi khi xóa vai trò ${roleName} (ID: ${roleId}):`, error);
        toast.error(`Không thể xóa vai trò ${roleName}.`, { position: "top-right" });
        return false;
      }
    }
    return false;
  };

  // Reset search
  const resetSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  return {
    // Data
    roles,
    permissions,
    filteredRoles,
    currentRoles,

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
    fetchRoles,
    fetchPermissions,
    getRoleDetails,
    saveRole,
    deleteRole
  };
};
