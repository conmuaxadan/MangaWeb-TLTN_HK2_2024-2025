import { useState, useEffect } from 'react';
import roleService from '../services/role-service.js';

const usePermissionsManagement = () => {
  // State cho danh sách quyền hạn
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State cho modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPermission, setCurrentPermission] = useState(undefined);

  // Xử lý tìm kiếm
  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (permission.description && permission.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Tính toán phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPermissions = filteredPermissions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage);

  // Xử lý chuyển trang
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Xử lý thay đổi kích thước trang
  const handlePageSizeChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1); // Reset về trang đầu tiên
  };

  // Load danh sách quyền hạn
  useEffect(() => {
    fetchPermissions();
  }, []);

  // Hàm lấy danh sách quyền hạn
  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const response = await roleService.getAllPermissions();
      if (response) {
        console.log('Danh sách quyền hạn nhận được trong hook:', response);
        setPermissions(response);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách quyền hạn:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý xóa quyền hạn
  const handleDeletePermission = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa quyền hạn "${name}"?`)) {
      try {
        const success = await roleService.deletePermission(id, name);
        if (success) {
          setPermissions(permissions.filter(permission => permission.id !== id));
        }
      } catch (error) {
        console.error(`Lỗi khi xóa quyền hạn ${name} (ID: ${id}):`, error);
      }
    }
  };

  // Xử lý mở modal thêm mới
  const handleAddPermission = () => {
    setCurrentPermission(undefined);
    setIsModalOpen(true);
  };

  // Xử lý mở modal chỉnh sửa
  const handleEditPermission = (permission) => {
    if (!permission.id) {
      console.error('Không thể chỉnh sửa quyền hạn không có ID');
      return;
    }
    setCurrentPermission(permission);
    setIsModalOpen(true);
  };

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPermission(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (data) => {
    setIsSubmitting(true);
    try {
      if (currentPermission?.id) {
        // Cập nhật quyền hạn
        const response = await roleService.updatePermission(currentPermission.id, data);
        if (response) {
          setPermissions(
            permissions.map(permission =>
              permission.id === currentPermission.id
                ? response
                : permission
            )
          );
          setIsModalOpen(false);
        }
      } else {
        // Tạo quyền hạn mới
        // Kiểm tra trùng tên
        if (permissions.some(permission => permission.name.toLowerCase() === data.name.toLowerCase())) {
          alert('Quyền hạn này đã tồn tại');
          setIsSubmitting(false);
          return;
        }

        const response = await roleService.createPermission(data);
        if (response) {
          setPermissions([...permissions, response]);
          setIsModalOpen(false);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu quyền hạn:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý reset tìm kiếm
  const resetSearch = () => {
    setSearchTerm('');
  };

  return {
    // Data
    permissions,
    filteredPermissions,
    currentPermissions,
    currentPermission,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,

    // State
    isLoading,
    isSubmitting,
    isModalOpen,
    searchTerm,
    currentPage,
    itemsPerPage,

    // Actions
    setSearchTerm,
    handleAddPermission,
    handleEditPermission,
    handleDeletePermission,
    handleCloseModal,
    handleSubmitForm,
    paginate,
    handlePageSizeChange,
    resetSearch,
    fetchPermissions
  };
};

export default usePermissionsManagement;
