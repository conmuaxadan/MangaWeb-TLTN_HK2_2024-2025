import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faEdit, faTrash, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { PermissionResponse } from '../../interfaces/models/auth';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import PermissionForm from '../../components/admin/PermissionForm';
import roleService from '../../services/role-service';

const PermissionManagement: React.FC = () => {
  // State cho danh sách quyền hạn
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // State cho modal và form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<PermissionResponse | undefined>(undefined);

  // State cho loading
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Xử lý mở modal thêm quyền hạn
  const handleAddPermission = () => {
    setCurrentPermission(undefined);
    setIsModalOpen(true);
  };

  // Xử lý mở modal sửa quyền hạn
  const handleEditPermission = (permission: PermissionResponse) => {
    setCurrentPermission(permission);
    setIsModalOpen(true);
  };

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPermission(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (data: { name: string; description: string }) => {
    setIsSubmitting(true);

    try {
      if (currentPermission) {
        // Cập nhật quyền hạn
        if (currentPermission.id) {
          console.log("Gọi API cập nhật quyền hạn từ modal:", currentPermission.id, data);
          const updatedPermission = await roleService.updatePermission(currentPermission.id, data);
          if (updatedPermission) {
            // Cập nhật danh sách quyền hạn
            setPermissions(permissions.map(p =>
              p.id === currentPermission.id
                ? updatedPermission
                : p
            ));
          } else {
            // Nếu API thất bại, vẫn cập nhật UI để trải nghiệm người dùng tốt hơn
            setPermissions(permissions.map(p =>
              p.id === currentPermission.id
                ? { ...p, ...data }
                : p
            ));
          }
        } else {
          // Fallback nếu không có ID
          setPermissions(permissions.map(p =>
            p.name === currentPermission.name
              ? { ...p, ...data }
              : p
          ));
        }
        setIsModalOpen(false);
      } else {
        // Tạo quyền hạn mới
        const response = await roleService.createPermission(data);
        if (response) {
          // Thêm quyền hạn mới vào danh sách
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

  // Xử lý bắt đầu chỉnh sửa inline
  const handleStartInlineEdit = (permission: PermissionResponse) => {
    // Sử dụng name để hiển thị trong UI, nhưng lưu ID để xử lý
    setEditingInline(permission.name);
    console.log("Bắt đầu chỉnh sửa permission:", permission);
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
  const handleSaveInlineEdit = async () => {
    if (!inlineFormData.description) {
      inlineFormData.description = '';
    }

    // Tìm permission đang được chỉnh sửa
    const editingPermission = permissions.find(p => p.name === editingInline);

    if (editingPermission && editingPermission.id) {
      try {
        // Gọi API cập nhật permission
        const updatedPermission = await roleService.updatePermission(editingPermission.id, inlineFormData);

        if (updatedPermission) {
          // Cập nhật state với kết quả trả về từ API
          setPermissions(permissions.map(p =>
            p.id === editingPermission.id
              ? updatedPermission
              : p
          ));
        } else {
          // Nếu API thất bại, vẫn cập nhật UI để trải nghiệm người dùng tốt hơn
          setPermissions(permissions.map(p =>
            p.id === editingPermission.id
              ? { ...p, ...inlineFormData }
              : p
          ));
        }
      } catch (error) {
        console.error(`Lỗi khi cập nhật quyền hạn ${editingInline}:`, error);
        // Vẫn cập nhật UI dù có lỗi
        setPermissions(permissions.map(p =>
          p.id === editingPermission.id
            ? { ...p, ...inlineFormData }
            : p
        ));
      }
    } else {
      // Fallback nếu không có ID
      setPermissions(permissions.map(p =>
        p.name === editingInline
          ? { ...p, ...inlineFormData }
          : p
      ));
    }

    setEditingInline(null);
  };

  // Xử lý hủy chỉnh sửa inline
  const handleCancelInlineEdit = () => {
    setEditingInline(null);
  };

  // Xử lý xóa quyền hạn
  const handleDeletePermission = async (permissionId: number, permissionName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa quyền hạn ${permissionName}?`)) {
      try {
        const success = await roleService.deletePermission(permissionId, permissionName);
        if (success) {
          // Xóa quyền hạn khỏi danh sách
          setPermissions(permissions.filter(p => p.id !== permissionId));
        }
      } catch (error) {
        console.error(`Lỗi khi xóa quyền hạn ${permissionName} (ID: ${permissionId}):`, error);
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

      {/* Modal thêm/sửa quyền hạn */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentPermission ? 'Chỉnh sửa quyền hạn' : 'Thêm quyền hạn mới'}
        size="md"
      >
        <PermissionForm
          initialData={currentPermission}
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
                      ID
                    </th>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {permission.id || '-'}
                          </td>
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
                            {permission.id || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {permission.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                            {permission.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditPermission(permission)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() => handleDeletePermission(permission.id, permission.name)}
                              className="text-red-600 hover:text-red-900"
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
