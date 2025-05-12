import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faEye, faEyeSlash, faTrash, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import ProfileLayout from '../components/layouts/ProfileLayout';
import authService from '../services/auth-service';
import { LinkedAccountResponse } from '../interfaces/models/auth';
import { OAuthConfig } from '../configurations/configuration';
import { TOKEN_STORAGE } from '../configurations/api-config';

const LinkedAccounts: React.FC = () => {
  const navigate = useNavigate();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccountResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Form state for linking local account
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  // Validation states
  const [usernameError, setUsernameError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');

  useEffect(() => {
    // Kiểm tra token trong localStorage
    const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
    if (!token) {
      navigate('/login');
      return;
    }

    // Lấy thông tin người dùng và danh sách tài khoản liên kết
    const fetchData = async () => {
      setLoading(true);
      try {
        // Lấy thông tin người dùng từ token
        const tokenInfo = authService.getCurrentUser();
        if (tokenInfo) {
          console.log('Thông tin từ token:', tokenInfo);
          // Đặt giá trị mặc định cho authProvider nếu không có trong token
          const authProvider = tokenInfo.authProvider || 'LOCAL';
          console.log('Loại tài khoản:', authProvider);

          setUserInfo({
            id: tokenInfo.userId,
            username: tokenInfo.email.split('@')[0], // Tạo username từ email
            email: tokenInfo.email,
            roles: [],
            authProvider: authProvider
          });
        }

        // Lấy danh sách tài khoản liên kết
        const accounts = await authService.getLinkedAccounts();
        if (accounts) {
          console.log('Tài khoản liên kết đã xử lý:', accounts);
          setLinkedAccounts(accounts);
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin tài khoản liên kết:', error);
        toast.error('Không thể tải thông tin tài khoản liên kết', {position: 'top-right'});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Xử lý liên kết với Google
  const handleGoogleLink = () => {
    // Tạo URL để chuyển hướng đến trang xác thực Google
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${OAuthConfig.clientId}&redirect_uri=${encodeURIComponent(OAuthConfig.redirectUri)}&response_type=code&scope=email%20profile&access_type=offline&prompt=consent`;

    // Lưu trạng thái hiện tại để biết đây là yêu cầu liên kết, không phải đăng nhập
    localStorage.setItem('auth_action', 'link_google');

    // Chuyển hướng đến trang xác thực Google
    window.location.href = authUrl;
  };

  // Xử lý hủy liên kết tài khoản
  const handleUnlink = async (accountId: string) => {
    console.log('handleUnlink được gọi với accountId:', accountId);
    console.log('Số lượng tài khoản liên kết:', linkedAccounts.length);

    // Không cần kiểm tra số lượng tài khoản liên kết
    // Vì việc xóa tài khoản liên kết không ảnh hưởng đến tài khoản chính

    const confirmed = window.confirm('Bạn có chắc chắn muốn hủy liên kết tài khoản này không?');
    if (!confirmed) return;

    try {
      console.log('Gọi API unlinkAccount với accountId:', accountId);
      const success = await authService.unlinkAccount(accountId);
      console.log('Kết quả unlinkAccount:', success);

      if (success) {
        // Cập nhật danh sách tài khoản liên kết
        setLinkedAccounts(prevAccounts => prevAccounts.filter(account => account.id !== accountId));
        console.log('Đã cập nhật danh sách tài khoản liên kết');
      }
    } catch (error) {
      console.error('Lỗi khi hủy liên kết tài khoản:', error);
    }
  };

  // Validate username
  const validateUsername = () => {
    if (!username) {
      setUsernameError('Tên đăng nhập không được để trống');
      return false;
    }

    if (username.length < 5) {
      setUsernameError('Tên đăng nhập phải có ít nhất 5 ký tự');
      return false;
    }

    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameError('Tên đăng nhập chỉ được chứa chữ cái, số, dấu chấm, gạch dưới và gạch ngang');
      return false;
    }

    setUsernameError('');
    return true;
  };

  // Validate email
  const validateEmail = () => {
    if (!email) {
      setEmailError('Email không được để trống');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Email không hợp lệ');
      return false;
    }

    setEmailError('');
    return true;
  };

  // Validate password
  const validatePassword = () => {
    if (!password) {
      setPasswordError('Mật khẩu không được để trống');
      return false;
    }

    if (password.length < 8) {
      setPasswordError('Mật khẩu phải có ít nhất 8 ký tự');
      return false;
    }

    // Kiểm tra mật khẩu mạnh (có ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError('Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt');
      return false;
    }

    setPasswordError('');
    return true;
  };

  // Validate confirm password
  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      setConfirmPasswordError('Xác nhận mật khẩu không được để trống');
      return false;
    }

    if (confirmPassword !== password) {
      setConfirmPasswordError('Xác nhận mật khẩu không khớp');
      return false;
    }

    setConfirmPasswordError('');
    return true;
  };

  // Xử lý liên kết tài khoản local
  const handleLinkLocalAccount = async (e: FormEvent) => {
    e.preventDefault();

    // Validate form
    const isUsernameValid = validateUsername();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();

    if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setFormLoading(true);
    try {
      const success = await authService.linkLocalAccount(username, email, password);
      if (success) {
        // Reset form
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');

        // Cập nhật danh sách tài khoản liên kết
        const accounts = await authService.getLinkedAccounts();
        if (accounts) {
          setLinkedAccounts(accounts);
        }
      }
    } catch (error) {
      console.error('Lỗi khi liên kết tài khoản local:', error);
    } finally {
      setFormLoading(false);
    }
  };

  // Hiển thị form liên kết tài khoản local
  const renderLinkLocalForm = () => {
    // Nếu người dùng chưa đăng nhập, không hiển thị form
    if (!userInfo) {
      return null;
    }

    console.log('renderLinkLocalForm - authProvider:', userInfo.authProvider);

    // Chỉ hiển thị form này khi người dùng đăng nhập bằng Google
    if (userInfo.authProvider !== 'GOOGLE') {
      return null;
    }

    // Tiêu đề và mô tả cho form liên kết tài khoản Local
    const title = 'Tạo tài khoản Local mới';
    const description = 'Tạo tài khoản local để có thể đăng nhập bằng tên đăng nhập và mật khẩu.';

      return (
          <div className="mt-5 rounded-md bg-gray-800 p-6 shadow">
            <h6 className="mb-4 text-lg font-semibold">{title}</h6>
            <p className="text-gray-400 mb-4">
              {description}
            </p>
            <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-md">
              <p className="text-blue-300 text-sm">
                <strong>Lưu ý:</strong> Tạo tài khoản Local sẽ cho phép bạn đăng nhập bằng tên đăng nhập và mật khẩu,
                thay vì phải thông qua Google mỗi lần đăng nhập. Tài khoản Local và tài khoản Google của bạn sẽ chia sẻ cùng một hồ sơ người dùng.
              </p>
            </div>
            <form onSubmit={handleLinkLocalAccount}>
              {/* Tên đăng nhập */}
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <div
                    className="relative input-icon-container flex items-center overflow-hidden border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-zinc-700/50 transition-all duration-200">
              <span className="pl-4 text-gray-400">
                <FontAwesomeIcon icon={faUser}/>
              </span>
                  <input
                      id="username"
                      type="text"
                      placeholder="Nhập tên đăng nhập"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onBlur={validateUsername}
                      className="w-full p-3 bg-transparent text-white focus:outline-none"
                  />
                </div>
                {usernameError && (
                    <p className="mt-1 text-sm text-red-500">{usernameError}</p>
                )}
              </div>

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div
                    className="relative input-icon-container flex items-center overflow-hidden border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-zinc-700/50 transition-all duration-200">
              <span className="pl-4 text-gray-400">
                <FontAwesomeIcon icon={faEnvelope}/>
              </span>
                  <input
                      id="email"
                      type="email"
                      placeholder="Nhập địa chỉ email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={validateEmail}
                      className="w-full p-3 bg-transparent text-white focus:outline-none"
                  />
                </div>
                {emailError && (
                    <p className="mt-1 text-sm text-red-500">{emailError}</p>
                )}
              </div>

              {/* Mật khẩu */}
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div
                    className="relative input-icon-container flex items-center overflow-hidden border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-zinc-700/50 transition-all duration-200">
              <span className="pl-4 text-gray-400">
                <FontAwesomeIcon icon={faLock}/>
              </span>
                  <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={validatePassword}
                      className="w-full p-3 bg-transparent text-white focus:outline-none"
                  />
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-400 hover:text-white"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye}/>
                  </button>
                </div>
                {passwordError && (
                    <p className="mt-1 text-sm text-red-500">{passwordError}</p>
                )}
              </div>

              {/* Xác nhận mật khẩu */}
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div
                    className="relative input-icon-container flex items-center overflow-hidden border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-zinc-700/50 transition-all duration-200">
              <span className="pl-4 text-gray-400">
                <FontAwesomeIcon icon={faLock}/>
              </span>
                  <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Xác nhận mật khẩu"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={validateConfirmPassword}
                      className="w-full p-3 bg-transparent text-white focus:outline-none"
                  />
                  <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-gray-400 hover:text-white"
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye}/>
                  </button>
                </div>
                {confirmPasswordError && (
                    <p className="mt-1 text-sm text-red-500">{confirmPasswordError}</p>
                )}
              </div>

              <button
                  type="submit"
                  disabled={formLoading}
                  className="mt-4 w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-800 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {formLoading ? 'Đang xử lý...' : 'Tạo tài khoản Local'}
              </button>
            </form>
          </div>
      );
    }

    // Hiển thị nút liên kết với Google
    const renderLinkGoogleButton = () => {
      if (!userInfo) {
        return null;
      }

      console.log('renderLinkGoogleButton - authProvider:', userInfo.authProvider);

      // Chỉ hiển thị nút này khi người dùng đăng nhập bằng tài khoản Local
      if (userInfo.authProvider !== 'LOCAL') {
        return null;
      }

      // Kiểm tra xem đã liên kết với Google chưa
      const hasGoogleLinked = linkedAccounts.some(account => account.provider === 'GOOGLE');

      // Nếu đã liên kết với Google rồi, không hiển thị nút
      if (hasGoogleLinked) {
        return null;
      }

      // Tiêu đề và mô tả cho nút liên kết Google
      const title = 'Liên kết với Google';
      const description = 'Liên kết tài khoản của bạn với Google để đăng nhập dễ dàng hơn.';

      return (
          <div className="mt-5 rounded-md bg-gray-800 p-6 shadow">
            <h6 className="mb-4 text-lg font-semibold">{title}</h6>
            <p className="text-gray-400 mb-4">
              {description}
            </p>
            <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-md">
              <p className="text-blue-300 text-sm">
                <strong>Lưu ý:</strong> Khi liên kết với Google, bạn có thể đăng nhập bằng tài khoản Google của mình.
                Tài khoản Google và tài khoản Local của bạn sẽ chia sẻ cùng một hồ sơ người dùng.
              </p>
            </div>
            <button
                onClick={handleGoogleLink}
                className="w-full py-3 px-4 bg-white text-gray-800 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-zinc-800 transition-all duration-200 shadow-md"
            >
              <span className="text-red-500 mr-2">G</span>
              Liên kết với Google <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1 text-sm"/>
            </button>
          </div>
      );
    };

    if (loading) {
      return (
          <ProfileLayout>
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </ProfileLayout>
      );
    }

    return (
        <ProfileLayout>
          <div className="grid grid-cols-1 gap-[30px]">
            <div>
              <h5 className="text-xl font-semibold mb-4">Quản lý tài khoản liên kết</h5>

            {/* Danh sách tài khoản liên kết */}
            <div className="rounded-md bg-gray-800 p-6 shadow">
              <h6 className="mb-4 text-lg font-semibold">Tài khoản đã liên kết</h6>

              {userInfo && userInfo.authProvider === 'GOOGLE' && (
                <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-md">
                  <p className="text-blue-300 text-sm">
                    <strong>Lưu ý:</strong> Bạn đang sử dụng tài khoản Google để đăng nhập.
                    Bạn có thể tạo thêm tài khoản Local để đăng nhập bằng tên đăng nhập và mật khẩu.
                  </p>
                </div>
              )}

              {linkedAccounts.length === 0 ? (
                  <p className="text-gray-400">Bạn chưa liên kết với bất kỳ tài khoản nào.</p>
              ) : (
                  <>
                    <div className="space-y-4">
                    {linkedAccounts.map(account => (
                        <div key={account.id}
                             className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium">
                              {account.provider === 'LOCAL' ? 'Tài khoản Local' :
                                  account.provider === 'GOOGLE' ? 'Tài khoản Google' :
                                      `Tài khoản ${account.provider}`}
                            </div>
                            <div className="text-sm text-gray-400">
                              {account.username ? `Username: ${account.username}` : ''}
                              {account.email ? (account.username ? ' | ' : '') + `Email: ${account.email}` : ''}
                            </div>
                            {account.linkedAt && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Liên kết vào: {
                                  (() => {
                                    try {
                                      return new Date(account.linkedAt).toLocaleString('vi-VN');
                                    } catch (error) {
                                      console.error('Lỗi chuyển đổi ngày tháng:', error);
                                      return String(account.linkedAt);
                                    }
                                  })()
                                }
                                </div>
                            )}
                          </div>
                          <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Nút xóa được nhấn cho account:', account.id);
                                handleUnlink(account.id);
                              }}
                              className="p-2 text-red-400 hover:text-red-500 focus:outline-none"
                              title="Hủy liên kết"
                              // Không vô hiệu hóa nút xóa tài khoản liên kết
                              disabled={false}
                          >
                            <FontAwesomeIcon icon={faTrash}/>
                          </button>
                        </div>
                    ))}
                  </div>
                  </>
              )}
            </div>

            {/* Form liên kết tài khoản local (nếu đăng nhập bằng Google) */}
            {renderLinkLocalForm()}

            {/* Nút liên kết với Google (nếu đăng nhập bằng tài khoản local) */}
            {renderLinkGoogleButton()}
            </div>
          </div>
        </ProfileLayout>
    );
  };


export default LinkedAccounts;