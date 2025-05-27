import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faKey } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import profileService from '../services/profile-service.js';
import { toast } from 'react-toastify';
import ProfileLayout from '../components/layouts/ProfileLayout.jsx';

const ProfileSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarFile, setAvatarFile] = useState(null);
  // const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);
  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);

      // // Tạo preview
      // const reader = new FileReader();
      // reader.onloadend = () => {
      //   setAvatarPreview(reader.result as string);
      // };
      // reader.readAsDataURL(file);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!user) return;

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp', { position: 'top-right' });
      return;
    }

    // Kiểm tra độ mạnh của mật khẩu
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$/;
    if (newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự', { position: 'top-right' });
      return;
    }
    if (!passwordRegex.test(newPassword)) {
      toast.error('Mật khẩu mới phải chứa ít nhất một chữ số, một chữ thường, một chữ hoa và một ký tự đặc biệt (@#$%^&+=)', { position: 'top-right' });
      return;
    }

    setLoading(true);
    try {
      // Gọi API đổi mật khẩu
      const success = await profileService.changePassword(oldPassword, newPassword);

      if (success) {
        toast.success('Đổi mật khẩu thành công', { position: 'top-right' });

        // Xóa các trường mật khẩu
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Lỗi khi đổi mật khẩu:', error);
      toast.error('Không thể đổi mật khẩu', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDisplayName = async (e) => {
    e.preventDefault();

    if (!user) return;

    // Kiểm tra độ dài của displayName
    if (!displayName || displayName.trim().length < 6) {
      toast.error('Tên hiển thị phải có ít nhất 6 ký tự', { position: 'top-right' });
      return;
    }

    if (displayName.length > 16) {
      toast.error('Tên hiển thị không được vượt quá 16 ký tự', { position: 'top-right' });
      return;
    }

    setLoading(true);
    try {
      const success = await profileService.updateProfile(displayName);
      if (success) {
        // Reload trang để cập nhật thông tin
        window.location.reload();
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật tên hiển thị:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAvatar = async (e) => {
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
      const success = await profileService.uploadAvatar(avatarFile);

      if (success) {
        // Reload trang để hiển thị ảnh mới
        window.location.reload();
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật ảnh đại diện:', error);
      toast.error('Không thể cập nhật ảnh đại diện', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };



  return (
    <ProfileLayout>
      <div className="grid grid-cols-1 gap-[30px]">
        <div>
        {/* Đổi mật khẩu */}
        <div className="rounded-md bg-white p-6 shadow border border-gray-200">
          <h6 className="mb-4 text-lg font-semibold">Đổi mật khẩu</h6>
          <form onSubmit={handleUpdatePassword}>
            <div>
              <label className="form-label font-medium">Mật khẩu cũ : <span className="text-red-600">*</span></label>
              <div className="form-icon relative my-2">
                <FontAwesomeIcon icon={faKey} className="absolute left-4 top-3 h-4 w-4" />
                <input
                  className="form-input h-10 w-full rounded border border-gray-300 bg-white px-3 py-2 pl-12 outline-none focus:border-blue-600 focus:ring-0"
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
                  className="form-input h-10 w-full rounded border border-gray-300 bg-white px-3 py-2 pl-12 outline-none focus:border-blue-600 focus:ring-0"
                  placeholder="Mật khẩu mới"
                  id="new-password"
                  type="password"
                  name="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                />
              </div>

              <div className="mt-2 text-sm text-gray-600">
                <p>Mật khẩu mới phải đáp ứng các yêu cầu sau:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Ít nhất 8 ký tự</li>
                  <li>Ít nhất 1 chữ số (0-9)</li>
                  <li>Ít nhất 1 chữ thường (a-z)</li>
                  <li>Ít nhất 1 chữ hoa (A-Z)</li>
                  <li>Ít nhất 1 ký tự đặc biệt (@#$%^&+=)</li>
                </ul>
              </div>

              <label className="form-label mt-4 font-medium">Xác nhận mật khẩu mới : <span className="text-red-600">*</span></label>
              <div className="form-icon relative my-2">
                <FontAwesomeIcon icon={faKey} className="absolute left-4 top-3 h-4 w-4" />
                <input
                  className="form-input h-10 w-full rounded border border-gray-300 bg-white px-3 py-2 pl-12 outline-none focus:border-blue-600 focus:ring-0"
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
                disabled={loading || !oldPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8 || !/(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])/.test(newPassword)}
                className="mt-5 inline-block rounded-md border border-blue-600 bg-blue-600 px-5 py-2 text-center align-middle text-base font-semibold tracking-wide text-white duration-500 hover:border-blue-700 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>

        {/* Đổi tên người dùng */}
        <div className="mt-5 rounded-md bg-white p-6 shadow border border-gray-200">
          <h6 className="mb-4 text-lg font-semibold">Đổi tên người dùng</h6>
          <form onSubmit={handleUpdateDisplayName}>
            <div>
              <label className="form-label font-medium">Tên mới : <span className="text-red-600">*</span></label>
              <div className="form-icon relative my-2">
                <FontAwesomeIcon icon={faUser} className="absolute left-4 top-3 h-4 w-4" />
                <input
                  className="form-input h-10 w-full rounded border border-gray-300 bg-white px-3 py-2 pl-12 outline-none focus:border-blue-600 focus:ring-0"
                  placeholder="Tên mới"
                  id="name"
                  type="text"
                  name="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  minLength={6}
                  maxLength={16}
                />
              </div>

              <div className="mt-2 text-sm text-gray-600">
                <p>Tên hiển thị phải có độ dài từ 6 đến 16 ký tự</p>
              </div>

              <button
                type="submit"
                disabled={loading || !displayName || displayName.trim().length < 6 || displayName.length > 16}
                className="mt-5 inline-block rounded-md border border-blue-600 bg-blue-600 px-5 py-2 text-center align-middle text-base font-semibold tracking-wide text-white duration-500 hover:border-blue-700 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>

        {/* Đổi ảnh đại diện */}
        <div className="mt-5 rounded-md bg-white p-6 shadow border border-gray-200">
          <h6 className="mb-4 text-lg font-semibold">Đổi ảnh đại diện</h6>
          <form onSubmit={handleUpdateAvatar}>
            <div>
              <label className="form-label font-medium" htmlFor="avatar_url">Tải ảnh : <span className="text-red-600">*</span></label>
              <input
                accept="image/*"
                className="w-full rounded border border-gray-300 bg-white p-2"
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
      </div>
    </ProfileLayout>
  );
};

export default ProfileSettings;
