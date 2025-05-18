import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { RoleResponse, RoleRequest, PermissionResponse } from '../../interfaces/models/auth';
import RoleTable from '../../components/admin/RoleTable';
import RoleForm from '../../components/admin/RoleForm';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import roleService from '../../services/role-service';

const RoleManagement: React.FC = () => {
  // State cho danh sách vai trò và quyền hạn
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // State cho modal và form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleResponse | undefined>(undefined);

  // State cho loading
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setRoles(response);
        setTotalPages(Math.ceil(response.length / itemsPerPage));
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách vai trò:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm lấy danh sách quyền hạn
  const fetchPermissions = async () => {
    try {
      const response = await roleService.getAllPermissions();
      if (response) {
        setPermissions(response);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách quyền hạn:', error);
    }
  };

  // Xử lý tìm kiếm
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Tính toán phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRoles = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);

  // Xử lý chuyển trang
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Xử lý mở modal thêm vai trò
  const handleAddRole = () => {
    setCurrentRole(undefined);
    setIsModalOpen(true);
  };

  // Xử lý mở modal sửa vai trò
  const handleEditRole = async (role: RoleResponse) => {
    try {
      console.log("RoleManagement: handleEditRole với role:", role);
      // Lấy thông tin chi tiết của vai trò (bao gồm danh sách quyền hạn)
      if (role.id) {
        console.log("RoleManagement: Gọi getRoleById với ID:", role.id);
        const roleDetail = await roleService.getRoleById(role.id);
        console.log("RoleManagement: Kết quả getRoleById:", roleDetail);
        if (roleDetail) {
          setCurrentRole(roleDetail);
          setIsModalOpen(true);
        }
      } else {
        // Fallback to using name if ID is not available
        console.log("RoleManagement: Gọi getRoleByName với name:", role.name);
        const roleDetail = await roleService.getRoleByName(role.name);
        console.log("RoleManagement: Kết quả getRoleByName:", roleDetail);
        if (roleDetail) {
          setCurrentRole(roleDetail);
          setIsModalOpen(true);
        }
      }
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin chi tiết vai trò ${role.name}:`, error);
    }
  };

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentRole(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (data: RoleRequest) => {
    setIsSubmitting(true);
    console.log("RoleManagement: Gọi submit form với dữ liệu:", data);
    console.log("RoleManagement: currentRole:", currentRole);
    try {
      if (currentRole) {
        // Cập nhật vai trò
        console.log("RoleManagement: Gọi updateRole với ID:", currentRole.id || 0, "và name:", currentRole.name);
        const response = await roleService.updateRole(currentRole.id || 0, currentRole.name, data);
        console.log("RoleManagement: Kết quả updateRole:", response);
        if (response) {
          // Cập nhật danh sách vai trò
          setRoles(roles.map(role => role.id === response.id ? response : role));
          setIsModalOpen(false);
        }
      } else {
        // Tạo vai trò mới
        const response = await roleService.createRole(data);
        if (response) {
          // Thêm vai trò mới vào danh sách
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

  // Xử lý xóa vai trò
  const handleDeleteRole = async (roleId: number, roleName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vai trò ${roleName}?`)) {
      try {
        const success = await roleService.deleteRole(roleId, roleName);
        if (success) {
          // Xóa vai trò khỏi danh sách
          setRoles(roles.filter(role => role.id !== roleId));
        }
      } catch (error) {
        console.error(`Lỗi khi xóa vai trò ${roleName} (ID: ${roleId}):`, error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý vai trò</h1>
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
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-gray-500" />
          </div>
          <input
            type="text"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Tìm kiếm vai trò..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bảng vai trò */}
      <RoleTable
        roles={currentRoles}
        onEdit={handleEditRole}
        onDelete={handleDeleteRole}
        loading={isLoading}
      />

      {/* Phân trang */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={paginate}
          totalItems={filteredRoles.length}
          showingFrom={indexOfFirstItem + 1}
          showingTo={indexOfLastItem > filteredRoles.length ? filteredRoles.length : indexOfLastItem}
        />
      )}
    </div>
  );
};

export default RoleManagement;
