import React, { useState, useEffect } from 'react';
import { RoleRequest, RoleResponse, PermissionResponse } from '../../interfaces/models/auth';

interface RoleFormProps {
  initialData?: RoleResponse;
  permissions: PermissionResponse[];
  onSubmit: (data: RoleRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const RoleForm: React.FC<RoleFormProps> = ({
  initialData,
  permissions,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<RoleRequest>({
    name: '',
    permissions: [],
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cập nhật formData khi initialData thay đổi
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        permissions: initialData.permissions?.map(p => p.name) || [],
        description: initialData.description || ''
      });
    } else {
      // Reset form khi tạo mới
      setFormData({
        name: '',
        permissions: [],
        description: ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handlePermissionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData(prev => ({
      ...prev,
      permissions: selectedOptions
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate name
    if (!formData.name) {
      newErrors.name = 'Tên vai trò không được để trống';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Tên vai trò phải có ít nhất 3 ký tự';
    }
    
    // Validate permissions
    if (formData.permissions.length === 0) {
      newErrors.permissions = 'Phải chọn ít nhất một quyền hạn';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        {initialData ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tên vai trò
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!!initialData} // Disable nếu đang chỉnh sửa
            className={`w-full px-3 py-2 border ${
              errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
              initialData ? 'bg-gray-100 dark:bg-gray-600' : ''
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
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        {/* Permissions */}
        <div>
          <label htmlFor="permissions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quyền hạn
          </label>
          <select
            id="permissions"
            name="permissions"
            multiple
            value={formData.permissions}
            onChange={handlePermissionChange}
            className={`w-full px-3 py-2 border ${
              errors.permissions ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
            size={Math.min(permissions.length, 8)}
          >
            {permissions.map(permission => (
              <option key={permission.name} value={permission.name}>
                {permission.name} {permission.description ? `- ${permission.description}` : ''}
              </option>
            ))}
          </select>
          {errors.permissions && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.permissions}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Giữ Ctrl (hoặc Cmd trên Mac) để chọn nhiều quyền hạn.
          </p>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </span>
            ) : initialData ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;
