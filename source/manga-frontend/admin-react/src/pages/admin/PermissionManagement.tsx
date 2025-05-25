import React, { useState, useCallback, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faEdit, faTrash, faSave, faTimes, faSync } from '@fortawesome/free-solid-svg-icons';
import { PermissionResponse } from '../../interfaces/models/auth';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import PermissionForm from '../../components/admin/PermissionForm';
import { throttle } from '../../utils/performance';
import roleService from '../../services/role-service';
import { toast } from 'react-toastify';

const PermissionManagement: React.FC = () => {
  // State quản lý dữ liệu quyền
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State cho tìm kiếm và phân trang
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State cho modal và form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<PermissionResponse | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State cho chỉnh sửa inline
  const [editingInline, setEditingInline] = useState<string | null>(null);
  const [inlineFormData, setInlineFormData] = useState({ name: '', description: '' });

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await roleService.getAllPermissions();
      if (data) {
        setPermissions(data);
      } else {
        setError('Không thể tải danh sách quyền hạn');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load permissions when component mounts
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Lọc danh sách quyền dựa trên từ khóa tìm kiếm
  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (permission.description && permission.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Tính toán chỉ số phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPermissions = filteredPermissions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage);
  const showingFrom = indexOfFirstItem + 1;
  const showingTo = Math.min(indexOfLastItem, filteredPermissions.length);

  // Xử lý tìm kiếm với throttle
  const handleSearchChange = useCallback(
    throttle((value: string) => {
      setSearchTerm(value);
      setCurrentPage(1); // Reset về trang đầu khi tìm kiếm
    }, 300),
    []
  );

  // Xử lý phân trang với throttle
  const handlePageChange = useCallback(
    throttle((page: number) => {
      setCurrentPage(page);
    }, 300),
    []
  );

  // Xử lý thay đổi kích thước trang
  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1); // Reset về trang đầu tiên
  };

  // Xử lý mở modal thêm quyền hạn
  const handleAddPermission = () => {
    setCurrentPermission(undefined);
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
      if (currentPermission && currentPermission.id) {
        // Cập nhật quyền hạn
        const result = await roleService.updatePermission(currentPermission.id, data);
        if (result) {
          toast.success('Cập nhật quyền hạn thành công', { position: 'top-right' });
          await fetchPermissions(); // Tải lại danh sách sau khi cập nhật
        }
      } else {
        // Tạo mới quyền hạn
        const result = await roleService.createPermission(data);
        if (result) {
          toast.success('Thêm quyền hạn thành công', { position: 'top-right' });
          await fetchPermissions(); // Tải lại danh sách sau khi thêm mới
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Lỗi khi lưu quyền hạn:', error);
      toast.error('Lỗi khi lưu quyền hạn', { position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý thay đổi form inline
  const handleInlineFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInlineFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Xử lý bắt đầu chỉnh sửa inline
  const handleStartInlineEdit = (permission: PermissionResponse) => {
    setEditingInline(permission.name);
    setInlineFormData({
      name: permission.name,
      description: permission.description || ''
    });
  };

  // Xử lý lưu chỉnh sửa inline
  const handleSaveInlineEdit = async () => {
    const editingPermission = currentPermissions.find(p => p.name === editingInline);

    if (editingPermission && editingPermission.id) {
      try {
        const result = await roleService.updatePermission(editingPermission.id, {
          name: inlineFormData.name,
          description: inlineFormData.description || ''
        });

        if (result) {
          toast.success('Cập nhật quyền hạn thành công', { position: 'top-right' });
          await fetchPermissions(); // Tải lại danh sách sau khi cập nhật
        }
      } catch (error) {
        toast.error('Lỗi khi cập nhật quyền hạn', { position: 'top-right' });
      }
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
        const result = await roleService.deletePermission(permissionId, permissionName);
        if (result) {
          toast.success('Xóa quyền hạn thành công', { position: 'top-right' });
          await fetchPermissions(); // Tải lại danh sách sau khi xóa
        }
      } catch (error) {
        toast.error('Lỗi khi xóa quyền hạn', { position: 'top-right' });
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-500" />
            </div>
            <input
              type="text"
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              placeholder="Tìm kiếm quyền hạn..."
              defaultValue={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <button
            onClick={() => setSearchTerm('')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <FontAwesomeIcon icon={faSync} className="mr-2" />
            Đặt lại
          </button>
        </div>
      </div>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>{error}</p>
        </div>
      )}

      {/* Bảng quyền hạn */}
      {loading ? (
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
              {filteredPermissions.length === 0
                ? "Không có quyền hạn nào trong hệ thống"
                : "Không tìm thấy quyền hạn nào phù hợp"}
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
                              aria-label="Lưu"
                              title="Lưu thay đổi"
                            >
                              <FontAwesomeIcon icon={faSave} />
                            </button>
                            <button
                              onClick={handleCancelInlineEdit}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              aria-label="Hủy"
                              title="Hủy chỉnh sửa"
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
                              onClick={() => handleStartInlineEdit(permission)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                              aria-label="Sửa"
                              title="Sửa quyền hạn"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() => handleDeletePermission(permission.id!, permission.name)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              aria-label="Xóa"
                              title="Xóa quyền hạn"
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={filteredPermissions.length}
        showingFrom={showingFrom}
        showingTo={showingTo}
        pageSize={itemsPerPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default PermissionManagement;
