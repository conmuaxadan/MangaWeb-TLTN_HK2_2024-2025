import React, { useState, useEffect, useRef } from 'react';
import userService from '../../services/user-service.js';
import uploadService from '../../services/upload-service.js';
import { getAvatarUrl } from '../../utils/file-utils.js';

const UserForm = ({
  initialData,
  roles,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    displayName: '',
    avatarUrl: '',
    roles: []
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [oldAvatarUrl, setOldAvatarUrl] = useState('');
  const fileInputRef = useRef(null);

  // Cập nhật formData khi initialData thay đổi
  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username,
        password: '', // Không hiển thị mật khẩu khi chỉnh sửa
        email: initialData.email,
        displayName: initialData.displayName || '',
        avatarUrl: initialData.avatarUrl || '',
        roles: initialData.roles.length > 0 ? [initialData.roles[0].id || 0] : []
      });

      // Thiết lập avatar preview nếu có
      if (initialData.avatarUrl) {
        // Sử dụng getAvatarUrl để hiển thị đúng URL ảnh
        setAvatarPreview(getAvatarUrl(initialData.avatarUrl));
      }
    } else {
      // Reset form khi tạo mới
      setFormData({
        username: '',
        password: '',
        email: '',
        displayName: '',
        avatarUrl: '',
        roles: []
      });
      setAvatarPreview('');
      setAvatarFile(null);
    }

    // Reset oldAvatarUrl khi component được khởi tạo lại
    setOldAvatarUrl('');
  }, [initialData]);

  const handleChange = (e) => {
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

  const handleRoleChange = (e) => {
    const value = parseInt(e.target.value);
    setFormData(prev => ({
      ...prev,
      roles: value ? [value] : []
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate username
    if (!formData.username) {
      newErrors.username = 'Tên đăng nhập không được để trống';
    } else if (formData.username.length < 5) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 5 ký tự';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
      newErrors.username = 'Tên đăng nhập chỉ được chứa chữ cái, số và các ký tự ._-';
    }

    // Validate password (chỉ khi tạo mới hoặc có nhập mật khẩu)
    if (!initialData || formData.password) {
      if (!formData.password && !initialData) {
        newErrors.password = 'Mật khẩu không được để trống';
      } else if (formData.password && formData.password.length < 8) {
        newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
      } else if (formData.password && !/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$/.test(formData.password)) {
        newErrors.password = 'Mật khẩu phải chứa ít nhất 1 chữ số, 1 chữ thường, 1 chữ hoa và 1 ký tự đặc biệt';
      }
    }

    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Validate roles
    if (!formData.roles || formData.roles.length === 0) {
      newErrors.roles = 'Vai trò không được để trống';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý khi chọn file avatar
  const handleAvatarChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Kiểm tra loại file
      if (!file.type.startsWith('image/')) {
        alert('Chỉ chấp nhận file ảnh');
        return;
      }

      // Kiểm tra kích thước file (giới hạn 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ảnh không được vượt quá 5MB');
        return;
      }

      setAvatarFile(file);

      // Tạo preview URL cho avatar
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Xử lý khi click vào nút xóa avatar
  const handleRemoveAvatar = async () => {
    if (initialData?.id) {
      // Nếu đang chỉnh sửa user hiện có, gọi API xóa avatar
      try {
        const response = await userService.deleteAvatar(initialData.id);
        if (response) {
          // Cập nhật formData với avatarUrl mới (default.jpg)
          setFormData(prev => ({
            ...prev,
            avatarUrl: response.avatarUrl || ''
          }));

          // Cập nhật preview
          setAvatarPreview(response.avatarUrl ? getAvatarUrl(response.avatarUrl) : '');

          // Xóa file đã chọn (nếu có)
          setAvatarFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      } catch (error) {
        console.error('Lỗi khi xóa avatar:', error);
      }
    } else {
      // Nếu đang tạo user mới, chỉ cần xóa file đã chọn
      setAvatarFile(null);
      setAvatarPreview('');
      setFormData(prev => ({
        ...prev,
        avatarUrl: ''
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Nếu có file avatar mới, upload trước khi submit form
    if (avatarFile) {
      setIsUploading(true);
      try {
        // Nếu đang chỉnh sửa người dùng hiện có, sử dụng userId của người dùng đó
        const response = await userService.uploadAvatar(
          avatarFile,
          initialData?.id // Truyền userId nếu đang chỉnh sửa người dùng hiện có
        );

        if (response && response.avatarUrl) {
          // Cập nhật avatarUrl trong formData
          setFormData(prev => ({
            ...prev,
            avatarUrl: response.avatarUrl
          }));

          // Xóa file đã upload
          setAvatarFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }

          // Submit form với avatarUrl mới
          onSubmit({
            ...formData,
            avatarUrl: response.avatarUrl
          });
          return;
        }
      } catch (error) {
        console.error('Lỗi khi upload avatar:', error);
        alert('Có lỗi xảy ra khi tải lên ảnh. Vui lòng thử lại.');
        return;
      } finally {
        setIsUploading(false);
      }
    }

    // Nếu không có file avatar mới hoặc upload thất bại, submit form với dữ liệu hiện tại
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {initialData ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Tên đăng nhập
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={!!initialData} // Disable nếu đang chỉnh sửa
            className={`w-full px-3 py-2 border ${
              errors.username ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              initialData ? 'bg-gray-100' : ''
            }`}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            {initialData ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
          {!errors.password && (
            <p className="mt-1 text-xs text-gray-500">
              Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              initialData ? 'bg-gray-50' : ''
            }`}
            disabled={!!initialData} // Vô hiệu hóa khi chỉnh sửa người dùng hiện có
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
          {initialData && (
            <p className="mt-1 text-xs text-gray-500">
              Email không thể thay đổi sau khi tạo tài khoản
            </p>
          )}
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Tên hiển thị
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Tên hiển thị của người dùng (không bắt buộc, phải là duy nhất)
          </p>
        </div>

        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ảnh đại diện
          </label>
          <div className="mt-1 flex items-center space-x-4">
            {/* Avatar Preview */}
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                {avatarPreview ? (
                  <img
                    src={avatarPreview.startsWith('data:') ? avatarPreview : getAvatarUrl(avatarPreview)}
                    alt="Avatar Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.src = '/images/avt_default.jpg';
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Controls */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <input
                  type="file"
                  id="avatar"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Chọn ảnh
                </button>

                {avatarFile && (
                  <span className="ml-2 text-sm text-gray-600">
                    Ảnh đã chọn: {avatarFile.name}
                  </span>
                )}

                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="ml-2 px-3 py-1.5 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Xóa
                  </button>
                )}
              </div>

              {/* Hiển thị URL ảnh nếu có (chỉ để xem) */}
              {formData.avatarUrl && (
                <div className="flex items-center">
                  <input
                    type="text"
                    id="avatarUrl"
                    name="avatarUrl"
                    value={formData.avatarUrl}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-gray-50 text-gray-500"
                  />
                </div>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Tải lên ảnh đại diện (không bắt buộc). Ảnh sẽ được tải lên khi bạn nhấn nút "Cập nhật" hoặc "Thêm mới". Nếu bạn xóa ảnh, file cũng chỉ được xóa khi bạn nhấn "Cập nhật".
          </p>
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Vai trò
          </label>
          <select
            id="roles"
            name="roles"
            value={formData.roles.length > 0 ? formData.roles[0] : ''}
            onChange={handleRoleChange}
            className={`w-full px-3 py-2 border ${errors.roles ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          >
            <option value="">Chọn vai trò</option>
            {roles.map(role => (
              <option key={role.name} value={role.id}>
                {role.name} (ID: {role.id})
              </option>
            ))}
          </select>
          {errors.roles && (
            <p className="mt-1 text-sm text-red-600">{errors.roles}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading || isUploading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isUploading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isUploading ? 'Đang tải ảnh lên...' : 'Đang xử lý...'}
              </span>
            ) : initialData ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
