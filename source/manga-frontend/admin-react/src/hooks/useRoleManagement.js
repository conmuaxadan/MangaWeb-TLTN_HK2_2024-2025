import { useState, useEffect } from 'react';
import roleService from '../services/role-service.js';

const useRoleManagement = () => {
  // State cho danh sách vai trò
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State cho modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRole, setCurrentRole] = useState(undefined);

  // Xử lý tìm kiếm
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Tính toán phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRoles = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

  // Xử lý chuyển trang
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Xử lý thay đổi kích thước trang
  const handlePageSizeChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1); // Reset về trang đầu tiên
  };

  // Load danh sách vai trò và quyền hạn
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  // Hàm lấy danh sách vai trò
  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await roleService.getAllRoles();
      if (response) {
        console.log('Danh sách vai trò nhận được trong hook:', response);
        setRoles(response);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách vai trò:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm lấy danh sách quyền hạn
  const fetchPermissions = async () => {
    setIsLoadingPermissions(true);
    try {
      const response = await roleService.getAllPermissions();
      if (response) {
        console.log('Danh sách quyền hạn nhận được trong hook:', response);
        setPermissions(response);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách quyền hạn:', error);
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  // Xử lý xóa vai trò
  const handleDeleteRole = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vai trò "${name}"?`)) {
      try {
        const success = await roleService.deleteRole(id, name);
        if (success) {
          setRoles(roles.filter(role => role.id !== id));
        }
      } catch (error) {
        console.error(`Lỗi khi xóa vai trò ${name} (ID: ${id}):`, error);
      }
    }
  };

  // Xử lý mở modal thêm mới
  const handleAddRole = () => {
    setCurrentRole(undefined);
    setIsModalOpen(true);
  };

  // Xử lý mở modal chỉnh sửa
  const handleEditRole = async (role) => {
    if (!role.id) {
      console.error('Không thể chỉnh sửa vai trò không có ID');
      return;
    }

    // Lấy thông tin chi tiết của vai trò từ API
    try {
      const detailedRole = await roleService.getRoleById(role.id);
      if (detailedRole) {
        setCurrentRole(detailedRole);
        setIsModalOpen(true);
      } else {
        console.error('Không thể lấy thông tin chi tiết của vai trò');
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin chi tiết vai trò:', error);
    }
  };

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentRole(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (data) => {
    setIsSubmitting(true);
    try {
      if (currentRole?.id) {
        // Cập nhật vai trò
        const response = await roleService.updateRole(currentRole.id, currentRole.name, data);
        if (response) {
          setRoles(
            roles.map(role =>
              role.id === currentRole.id
                ? response
                : role
            )
          );
          setIsModalOpen(false);
        }
      } else {
        // Tạo vai trò mới
        // Kiểm tra trùng tên
        if (roles.some(role => role.name.toLowerCase() === data.name.toLowerCase())) {
          alert('Vai trò này đã tồn tại');
          setIsSubmitting(false);
          return;
        }

        const response = await roleService.createRole(data);
        if (response) {
          setRoles([...roles, response]);
          setIsModalOpen(false);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu vai trò:', error);
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
    roles,
    permissions,
    filteredRoles,
    currentRoles,
    currentRole,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,

    // State
    isLoading,
    isLoadingPermissions,
    isSubmitting,
    isModalOpen,
    searchTerm,
    currentPage,
    itemsPerPage,

    // Search
    setSearchTerm,
    resetSearch,

    // Pagination
    pageSize: itemsPerPage,
    paginate,
    handlePageSizeChange,    // CRUD operations
    getRoleDetails: async (role) => {
      console.log('Hook: Bắt đầu lấy chi tiết vai trò:', role);
      
      if (!role || !role.id) {
        const errorMsg = 'Không thể lấy chi tiết vai trò - thông tin vai trò không hợp lệ';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      try {
        console.log(`Hook: Gọi API lấy chi tiết vai trò ID ${role.id} (${role.name})`);
        const detailedRole = await roleService.getRoleById(role.id);
        console.log('Hook: Kết quả từ API:', detailedRole);
        
        if (detailedRole) {
          return detailedRole;
        } else {
          const errorMsg = `Không thể lấy thông tin chi tiết của vai trò ${role.name} (ID: ${role.id})`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (error) {
        const errorMsg = `Lỗi khi lấy thông tin chi tiết vai trò ${role.name} (ID: ${role.id}): ${error.message || 'Lỗi không xác định'}`;
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
    },
    saveRole: async (data, currentRole = null) => {
      setIsSubmitting(true);
      try {
        if (currentRole?.id) {
          // Cập nhật vai trò
          const response = await roleService.updateRole(currentRole.id, currentRole.name, data);
          if (response) {
            setRoles(
              roles.map(role =>
                role.id === currentRole.id
                  ? response
                  : role
              )
            );
            setIsModalOpen(false);
            return true;
          }
          return false;
        } else {
          // Tạo vai trò mới
          // Kiểm tra trùng tên
          if (roles.some(role => role.name.toLowerCase() === data.name.toLowerCase())) {
            alert('Vai trò này đã tồn tại');
            return false;
          }

          const response = await roleService.createRole(data);
          if (response) {
            setRoles([...roles, response]);
            setIsModalOpen(false);
            return true;
          }
          return false;
        }
      } catch (error) {
        console.error('Lỗi khi lưu vai trò:', error);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    deleteRole: async (id, name) => {
      if (window.confirm(`Bạn có chắc chắn muốn xóa vai trò "${name}"?`)) {
        try {
          const success = await roleService.deleteRole(id, name);
          if (success) {
            setRoles(roles.filter(role => role.id !== id));
            return true;
          }
          return false;
        } catch (error) {
          console.error(`Lỗi khi xóa vai trò ${name} (ID: ${id}):`, error);
          return false;
        }
      }
      return false;
    },
    
    // Legacy methods for backward compatibility
    handleAddRole,
    handleEditRole,
    handleDeleteRole,
    handleCloseModal,
    handleSubmitForm,
    fetchRoles,
    fetchPermissions
  };
};

export default useRoleManagement;
