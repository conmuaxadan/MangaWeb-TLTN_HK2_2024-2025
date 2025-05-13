import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import { UserResponse, UserRequest, RoleResponse } from '../../interfaces/models/auth';
import UserTable from '../../components/admin/UserTable';
import Pagination from '../../components/common/Pagination';
import UserForm from '../../components/admin/UserForm';
import userService from '../../services/user-service';
import roleService from '../../services/role-service';

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
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // State cho form thêm/sửa người dùng
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);

  // State cho loading
  const [isLoading, setIsLoading] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

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
        setTotalItems(response.length);
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

  // Xử lý mở form thêm người dùng
  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  // Xử lý mở form sửa người dùng
  const handleEditUser = (user: UserResponse) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  // Xử lý đóng form
  const handleCancelForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
  };

  // Xử lý submit form
  const handleSubmitForm = async (data: UserRequest) => {
    setIsFormSubmitting(true);
    try {
      if (editingUser) {
        // Cập nhật người dùng
        const response = await userService.updateUser(data);
        if (response) {
          // Cập nhật danh sách người dùng
          setUsers(users.map(user => user.id === response.id ? response : user));
          setShowUserForm(false);
          setEditingUser(null);
        }
      } else {
        // Tạo người dùng mới
        const response = await userService.createUser(data);
        if (response) {
          // Thêm người dùng mới vào danh sách
          setUsers([...users, response]);
          setShowUserForm(false);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu người dùng:', error);
    } finally {
      setIsFormSubmitting(false);
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

      {/* Form thêm/sửa người dùng */}
      {showUserForm && (
        <UserForm
          initialData={editingUser || undefined}
          roles={roles}
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
          isLoading={isFormSubmitting}
        />
      )}

      {/* Tìm kiếm và lọc */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tìm kiếm */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              placeholder="Tìm kiếm theo tên hoặc email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lọc theo vai trò */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500 dark:text-gray-400" />
            </div>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
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
              <FontAwesomeIcon icon={faFilter} className="text-gray-500 dark:text-gray-400" />
            </div>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
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
        loading={isLoading}
      />

      {/* Phân trang */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={paginate}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          showingFrom={indexOfFirstItem + 1}
          showingTo={indexOfLastItem > filteredUsers.length ? filteredUsers.length : indexOfLastItem}
        />
      )}
    </div>
  );
};

export default UserManagement;
