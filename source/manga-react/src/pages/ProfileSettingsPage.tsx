import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faKey } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import profileService from '../services/profile-service';
import { toast } from 'react-toastify';
import ProfileLayout from '../components/profile/ProfileLayout';

const ProfileSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState<string>(user?.displayName || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  React.useEffect(() => {
    // Kiểm tra token trong localStorage thay vì dựa vào isLogin
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Cập nhật displayName nếu user đã được tải
    if (user && user.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user, navigate]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);

      // Tạo preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp', { position: 'top-right' });
      return;
    }

    setLoading(true);
    try {
      // Gọi API đổi mật khẩu
      await profileService.changePassword(oldPassword, newPassword);

      toast.success('Đổi mật khẩu thành công', { position: 'top-right' });

      // Xóa các trường mật khẩu
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Lỗi khi đổi mật khẩu:', error);
      toast.error('Không thể đổi mật khẩu', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setLoading(true);
    try {
      // Cập nhật tên hiển thị
      const updateData = {
        displayName: displayName
      };

      await profileService.updateProfile(updateData);

      toast.success('Cập nhật tên hiển thị thành công', { position: 'top-right' });

      // Reload trang để cập nhật thông tin
      window.location.reload();
    } catch (error) {
      console.error('Lỗi khi cập nhật tên hiển thị:', error);
      toast.error('Không thể cập nhật tên hiển thị', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !avatarFile) return;

    // Kiểm tra kích thước file
    if (avatarFile.size > 1024 * 1024) { // 1MB
      toast.error('Kích thước ảnh phải nhỏ hơn 1MB', { position: 'top-right' });
      return;
    }

    setLoading(true);
    try {
      // Upload avatar
      await profileService.uploadAvatar(avatarFile);

      toast.success('Cập nhật ảnh đại diện thành công', { position: 'top-right' });

      // Reload trang để cập nhật thông tin
      window.location.reload();
    } catch (error) {
      console.error('Lỗi khi cập nhật ảnh đại diện:', error);
      toast.error('Không thể cập nhật ảnh đại diện', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileLayout>
      <div>
        {/* Đổi mật khẩu */}
        <div className="mt-5 rounded-md bg-gray-800 p-6 shadow">
          <h6 className="mb-4 text-lg font-semibold">Đổi mật khẩu</h6>
          <form onSubmit={handleUpdatePassword}>
            <div>
              <label className="form-label font-medium">Mật khẩu cũ : <span className="text-red-600">*</span></label>
              <div className="form-icon relative my-2">
                <FontAwesomeIcon icon={faKey} className="absolute left-4 top-3 h-4 w-4" />
                <input
                  className="form-input h-10 w-full rounded border border-gray-700 bg-transparent px-3 py-2 pl-12 outline-none focus:border-blue-600 focus:ring-0"
                  placeholder="Mật khẩu cũ"
                  id="old-password"
                  type="password"
                  name="oldPassword"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>

              <label className="form-label mt-4 font-medium">Mật khẩu mới : <span className="text-red-600">*</span></label>
              <div className="form-icon relative my-2">
                <FontAwesomeIcon icon={faKey} className="absolute left-4 top-3 h-4 w-4" />
                <input
                  className="form-input h-10 w-full rounded border border-gray-700 bg-transparent px-3 py-2 pl-12 outline-none focus:border-blue-600 focus:ring-0"
                  placeholder="Mật khẩu mới"
                  id="new-password"
                  type="password"
                  name="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <label className="form-label mt-4 font-medium">Xác nhận mật khẩu mới : <span className="text-red-600">*</span></label>
              <div className="form-icon relative my-2">
                <FontAwesomeIcon icon={faKey} className="absolute left-4 top-3 h-4 w-4" />
                <input
                  className="form-input h-10 w-full rounded border border-gray-700 bg-transparent px-3 py-2 pl-12 outline-none focus:border-blue-600 focus:ring-0"
                  placeholder="Xác nhận mật khẩu mới"
                  id="confirm-password"
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-5 inline-block rounded-md border border-blue-600 bg-blue-600 px-5 py-2 text-center align-middle text-base font-semibold tracking-wide text-white duration-500 hover:border-blue-700 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>

        {/* Đổi tên người dùng */}
        <div className="mt-5 rounded-md bg-gray-800 p-6 shadow">
          <h6 className="mb-4 text-lg font-semibold">Đổi tên người dùng</h6>
          <form onSubmit={handleUpdateDisplayName}>
            <div>
              <label className="form-label font-medium">Tên mới : <span className="text-red-600">*</span></label>
              <div className="form-icon relative my-2">
                <FontAwesomeIcon icon={faUser} className="absolute left-4 top-3 h-4 w-4" />
                <input
                  className="form-input h-10 w-full rounded border border-gray-700 bg-transparent px-3 py-2 pl-12 outline-none focus:border-blue-600 focus:ring-0"
                  placeholder="Tên mới"
                  id="name"
                  type="text"
                  name="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-5 inline-block rounded-md border border-blue-600 bg-blue-600 px-5 py-2 text-center align-middle text-base font-semibold tracking-wide text-white duration-500 hover:border-blue-700 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>

        {/* Đổi ảnh đại diện */}
        <div className="mt-5 rounded-md bg-gray-800 p-6 shadow">
          <h6 className="mb-4 text-lg font-semibold">Đổi ảnh đại diện</h6>
          <form onSubmit={handleUpdateAvatar}>
            <div>
              <label className="form-label font-medium" htmlFor="avatar_url">Tải ảnh : <span className="text-red-600">*</span></label>
              <input
                accept="image/*"
                className="w-full rounded border border-gray-700 bg-gray-800 p-2"
                type="file"
                onChange={handleAvatarChange}
              />

              <button
                type="submit"
                disabled={!avatarFile || loading}
                className="mt-5 inline-block rounded-md border border-blue-600 bg-blue-600 px-5 py-2 text-center align-middle text-base font-semibold tracking-wide text-white duration-500 hover:border-blue-700 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>

            <div className="mt-5">
              <div className="font-bold">Chú ý:</div>
              <ul>
                <li>- Kích thước ảnh phải nhỏ hơn 1MB.</li>
                <li>- Để ảnh nhạy cảm sẽ bị ban vĩnh viễn.</li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default ProfileSettingsPage;
