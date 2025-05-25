import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { PermissionResponse } from '../interfaces/models/auth';
import roleService from '../services/role-service';

type PermissionFormData = {
  name: string;
  description: string;
};

export const usePermissionsManagement = () => {
  // State cho dữ liệu
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // State cho form và mutations
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State cho tìm kiếm và phân trang
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await roleService.getAllPermissions();
      if (data) {
        setPermissions(data);
      } else {
        throw new Error('Không thể tải danh sách quyền hạn');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(new Error(errorMessage));
      toast.error(`Không thể tải danh sách quyền hạn: ${errorMessage}`, { position: 'top-right' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Create permission
  const createPermission = useCallback(async (data: PermissionFormData) => {
    setIsCreating(true);
    try {
      const result = await roleService.createPermission(data);
      if (result) {
        toast.success('Thêm quyền hạn thành công', { position: 'top-right' });
        await fetchPermissions(); // Tải lại danh sách sau khi thêm
        return result;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi';
      toast.error(`Lỗi khi thêm quyền hạn: ${errorMessage}`, { position: 'top-right' });
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [fetchPermissions]);

  // Update permission
  const updatePermission = useCallback(async ({ id, data }: { id: number; data: PermissionFormData }) => {
    setIsUpdating(true);
    try {
      const result = await roleService.updatePermission(id, data);
      if (result) {
        toast.success('Cập nhật quyền hạn thành công', { position: 'top-right' });
        await fetchPermissions(); // Tải lại danh sách sau khi cập nhật
        return result;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi';
      toast.error(`Lỗi khi cập nhật quyền hạn: ${errorMessage}`, { position: 'top-right' });
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [fetchPermissions]);

  // Delete permission
  const deletePermission = useCallback(async ({ id, name }: { id: number; name: string }) => {
    setIsDeleting(true);
    try {
      const result = await roleService.deletePermission(id, name);
      if (result) {
        toast.success('Xóa quyền hạn thành công', { position: 'top-right' });
        await fetchPermissions(); // Tải lại danh sách sau khi xóa
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi';
      toast.error(`Lỗi khi xóa quyền hạn: ${errorMessage}`, { position: 'top-right' });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [fetchPermissions]);

  // Filter permissions based on search term
  const filteredPermissions = useCallback(() => {
    return permissions.filter(permission =>
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (permission.description && permission.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [permissions, searchTerm]);

  // Get current permissions for pagination
  const getCurrentPermissions = useCallback(() => {
    const filtered = filteredPermissions();
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filtered.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredPermissions, currentPage, itemsPerPage]);

  // Calculate total pages
  const getTotalPages = useCallback(() => {
    return Math.ceil(filteredPermissions().length / itemsPerPage);
  }, [filteredPermissions, itemsPerPage]);

  // Tính toán giá trị hiển thị
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const showingFrom = filteredPermissions().length > 0 ? indexOfFirstItem + 1 : 0;
  const showingTo = Math.min(indexOfLastItem, filteredPermissions().length);

  return {
    // Data
    permissions,
    filteredPermissions: filteredPermissions(),
    currentPermissions: getCurrentPermissions(),

    // Pagination
    totalPages: getTotalPages(),
    currentPage,
    itemsPerPage,
    showingFrom,
    showingTo,
    setCurrentPage,

    // Search
    searchTerm,
    setSearchTerm,

    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,

    // CRUD operations
    createPermission,
    updatePermission,
    deletePermission,
    refreshPermissions: fetchPermissions
  };
};
