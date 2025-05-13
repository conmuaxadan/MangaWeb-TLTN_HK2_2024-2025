import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faEdit, faTrash, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { PermissionResponse } from '../../interfaces/models/auth';
import Pagination from '../../components/common/Pagination';
import roleService from '../../services/role-service';

const PermissionManagement: React.FC = () => {
  // State cho danh sách quyền hạn
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // State cho form thêm/sửa quyền hạn
  const [showForm, setShowForm] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionResponse | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State cho loading
  const [isLoading, setIsLoading] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // State cho chỉnh sửa inline
  const [editingInline, setEditingInline] = useState<string | null>(null);
  const [inlineFormData, setInlineFormData] = useState({ name: '', description: '' });

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
        setPermissions(response);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách quyền hạn:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Xử lý mở form thêm quyền hạn
  const handleAddPermission = () => {
    setEditingPermission(null);
    setFormData({ name: '', description: '' });
    setShowForm(true);
  };

  // Xử lý đóng form
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPermission(null);
    setErrors({});
  };

  // Xử lý thay đổi form
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Xóa lỗi khi người dùng nhập lại
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Xử lý submit form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: Record<string, string> = {};
    if (!formData.name) {
      newErrors.name = 'Tên quyền hạn không được để trống';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsFormSubmitting(true);

    try {
      if (editingPermission) {
        // Cập nhật quyền hạn (chưa có API nên giả lập)
        setPermissions(permissions.map(p =>
          p.name === editingPermission.name
            ? { ...formData }
            : p
        ));
      } else {
        // Tạo quyền hạn mới
        const response = await roleService.createPermission(formData);
        if (response) {
          // Thêm quyền hạn mới vào danh sách
          setPermissions([...permissions, response]);
          setShowForm(false);
          setEditingPermission(null);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu quyền hạn:', error);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Xử lý bắt đầu chỉnh sửa inline
  const handleStartInlineEdit = (permission: PermissionResponse) => {
    setEditingInline(permission.name);
    setInlineFormData({
      name: permission.name,
      description: permission.description || ''
    });
  };

  // Xử lý thay đổi form inline
  const handleInlineFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInlineFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Xử lý lưu chỉnh sửa inline
  const handleSaveInlineEdit = () => {
    if (!inlineFormData.description) {
      inlineFormData.description = '';
    }

    setPermissions(permissions.map(p =>
      p.name === editingInline
        ? { ...inlineFormData }
        : p
    ));

    setEditingInline(null);
  };

  // Xử lý hủy chỉnh sửa inline
  const handleCancelInlineEdit = () => {
    setEditingInline(null);
  };

  // Xử lý xóa quyền hạn
  const handleDeletePermission = async (permissionName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa quyền hạn ${permissionName}?`)) {
      try {
        const success = await roleService.deletePermission(permissionName);
        if (success) {
          // Xóa quyền hạn khỏi danh sách
          setPermissions(permissions.filter(p => p.name !== permissionName));
        }
      } catch (error) {
        console.error(`Lỗi khi xóa quyền hạn ${permissionName}:`, error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý quyền hạn</h1>
        <button
          onClick={handleAddPermission}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Thêm quyền hạn</span>
        </button>
      </div>

      {/* Form thêm/sửa quyền hạn */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {editingPermission ? 'Chỉnh sửa quyền hạn' : 'Thêm quyền hạn mới'}
          </h2>

          <form onSubmit={handleSubmitForm} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên quyền hạn
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                disabled={!!editingPermission} // Disable nếu đang chỉnh sửa
                className={`w-full px-3 py-2 border ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                  editingPermission ? 'bg-gray-100 dark:bg-gray-600' : ''
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mô tả
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isFormSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFormSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : editingPermission ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tìm kiếm */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-gray-500 dark:text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="Tìm kiếm quyền hạn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bảng quyền hạn */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {currentPermissions.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              Không tìm thấy quyền hạn nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tên quyền hạn
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Mô tả
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentPermissions.map((permission) => (
                    <tr key={permission.name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {editingInline === permission.name ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              name="name"
                              value={inlineFormData.name}
                              onChange={handleInlineFormChange}
                              disabled={true} // Không cho phép sửa tên
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white bg-gray-100 dark:bg-gray-600"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              name="description"
                              value={inlineFormData.description}
                              onChange={handleInlineFormChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={handleSaveInlineEdit}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                            >
                              <FontAwesomeIcon icon={faSave} />
                            </button>
                            <button
                              onClick={handleCancelInlineEdit}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {permission.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                            {permission.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleStartInlineEdit(permission)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() => handleDeletePermission(permission.name)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={paginate}
          totalItems={filteredPermissions.length}
          itemsPerPage={itemsPerPage}
          showingFrom={indexOfFirstItem + 1}
          showingTo={indexOfLastItem > filteredPermissions.length ? filteredPermissions.length : indexOfLastItem}
        />
      )}
    </div>
  );
};

export default PermissionManagement;
