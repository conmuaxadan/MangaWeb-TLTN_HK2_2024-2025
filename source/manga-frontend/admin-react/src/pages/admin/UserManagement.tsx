import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faPlus, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import { UserResponse, UserRequest, RoleResponse } from '../../interfaces/models/auth';
import UserTable from '../../components/admin/UserTable';
import Pagination from '../../components/common/Pagination';
import UserForm from '../../components/admin/UserForm';
import Modal from '../../components/common/Modal';
import userService from '../../services/user-service';
import roleService from '../../services/role-service';
import {toast} from "react-toastify";

const UserManagement: React.FC = () => {
  // State cho danh sách người dùng và vai trò
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [roles, setRoles] = useState<RoleResponse[]>([]);

  // State cho tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterProvider, setFilterProvider] = useState('');

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // State cho modal và form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserResponse | undefined>(undefined);

  // State cho loading
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load danh sách người dùng
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Hàm lấy danh sách người dùng
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await userService.getAllUsers();
      if (response) {
        setUsers(response);
        setTotalPages(Math.ceil(response.length / itemsPerPage));
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm lấy danh sách vai trò
  const fetchRoles = async () => {
    try {
      const response = await roleService.getAllRoles();
      if (response) {
        setRoles(response);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách vai trò:', error);
    }
  };

  // Xử lý tìm kiếm và lọc
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole ? user.roles.some(role => role.name === filterRole) : true;
    const matchesProvider = filterProvider ? user.authProvider === filterProvider : true;

    return matchesSearch && matchesRole && matchesProvider;
  });

  // Tính toán phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Xử lý chuyển trang
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Xử lý mở modal thêm người dùng
  const handleAddUser = () => {
    setCurrentUser(undefined);
    setIsModalOpen(true);
  };

  // Xử lý mở modal sửa người dùng
  const handleEditUser = (user: UserResponse) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (data: UserRequest) => {
    setIsSubmitting(true);
    try {
      if (currentUser) {
        // Cập nhật người dùng
        // Đảm bảo giữ nguyên email và username khi cập nhật
        const updateData = {
          ...data,
          id: currentUser.id,
          email: currentUser.email,
          username: currentUser.username
        };

        const response = await userService.updateUser(updateData);
        if (response) {
          // Cập nhật danh sách người dùng
          setUsers(users.map(user => user.id === response.id ? response : user));
          setIsModalOpen(false);
        }
      } else {
        // Tạo người dùng mới
        const response = await userService.createUser(data);
        if (response) {
          // Thêm người dùng mới vào danh sách
          setUsers([...users, response]);
          setIsModalOpen(false);
        }
      }
    } catch (error: any) {
      console.error('Lỗi khi lưu người dùng:', error);

      // Hiển thị thông báo lỗi cụ thể dựa trên mã lỗi
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;

      if (errorCode === 1108) {
        toast.error("Tên hiển thị đã tồn tại, vui lòng chọn tên khác", { position: "top-right" });
      } else if (errorCode === 1107) {
        toast.error("Email đã tồn tại, vui lòng sử dụng email khác", { position: "top-right" });
      } else if (errorCode === 1100) {
        toast.error("Tên đăng nhập đã tồn tại, vui lòng chọn tên khác", { position: "top-right" });
      } else {
        toast.error(errorMessage || "Có lỗi xảy ra khi lưu người dùng", { position: "top-right" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý xóa người dùng
  const handleDeleteUser = async (userId: string, username: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng ${username}?`)) {
      try {
        const success = await userService.deleteUser(username);
        if (success) {
          // Xóa người dùng khỏi danh sách
          setUsers(users.filter(user => user.id !== userId));
        }
      } catch (error) {
        console.error(`Lỗi khi xóa người dùng ${username}:`, error);
      }
    }
  };

  // Xử lý khóa/mở khóa tài khoản
  const handleToggleUserStatus = async (username: string, enabled: boolean) => {
    // Tìm user để lấy userId
    const user = users.find(u => u.username === username);
    if (!user) return;

    const action = enabled ? "mở khóa" : "khóa";
    if (window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản ${username}?`)) {
      try {
        const updatedUser = await userService.toggleUserStatus(user.id, enabled);
        if (updatedUser) {
          // Cập nhật danh sách người dùng
          setUsers(users.map(u => u.id === user.id ? updatedUser : u));
        }
      } catch (error) {
        console.error(`Lỗi khi ${action} tài khoản ${username}:`, error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
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

      {/* Tìm kiếm và lọc */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tìm kiếm */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-500" />
            </div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              placeholder="Tìm kiếm theo tên hoặc email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lọc theo vai trò */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
            </div>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">Tất cả vai trò</option>
              {roles.map(role => (
                <option key={role.name} value={role.name}>
                  {role.name.replace('ROLE_', '')}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo nhà cung cấp */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
            </div>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
            >
              <option value="">Tất cả nhà cung cấp</option>
              <option value="LOCAL">Local</option>
              <option value="GOOGLE">Google</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bảng người dùng */}
      <UserTable
        users={currentUsers}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onToggleStatus={handleToggleUserStatus}
        loading={isLoading}
      />

      {/* Phân trang */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={paginate}
          totalItems={filteredUsers.length}
          showingFrom={indexOfFirstItem + 1}
          showingTo={indexOfLastItem > filteredUsers.length ? filteredUsers.length : indexOfLastItem}
        />
      )}
    </div>
  );
};

export default UserManagement;
