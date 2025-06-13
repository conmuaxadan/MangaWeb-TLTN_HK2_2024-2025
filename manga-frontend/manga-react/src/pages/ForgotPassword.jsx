import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import authService from '../services/auth-service.js';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResetForm, setShowResetForm] = useState(false);
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const handleSendCode = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error('Vui lòng nhập địa chỉ email');
            return;
        }

        // Kiểm tra định dạng email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Địa chỉ email không hợp lệ');
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('Sending forgot password request for email:', email);
            const result = await authService.forgotPassword(email);
            console.log('Forgot password response:', result);

            if (result) {
                setShowResetForm(true);
                setCountdown(60);
                startCountdown();
                toast.success('Mã xác nhận đã được gửi đến email của bạn');
            }
        } catch (error) {
            console.error('Error in forgot password:', error);
            toast.error('Đã xảy ra lỗi. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const startCountdown = () => {
        const timer = setInterval(() => {
            setCountdown((prevCount) => {
                if (prevCount <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prevCount - 1;
            });
        }, 1000);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!resetCode) {
            toast.error('Vui lòng nhập mã xác nhận');
            return;
        }

        if (resetCode.length !== 6) {
            toast.error('Mã xác nhận phải có 6 số');
            return;
        }

        if (!newPassword) {
            toast.error('Vui lòng nhập mật khẩu mới');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Mật khẩu phải có ít nhất 8 ký tự');
            return;
        }

        const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$/;
        if (!passwordRegex.test(newPassword)) {
            toast.error('Mật khẩu phải có ít nhất một chữ số, một chữ thường, một chữ hoa và một ký tự đặc biệt');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await authService.resetPassword(email, resetCode, newPassword);

            if (result) {
                toast.success('Mật khẩu đã được đặt lại thành công');
                navigate('/login');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi. Mã xác nhận có thể đã hết hạn.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendCode = async () => {
        if (countdown > 0) return;

        setIsSubmitting(true);

        try {
            const result = await authService.forgotPassword(email);

            if (result) {
                setCountdown(60);
                startCountdown();
                toast.success('Mã xác nhận mới đã được gửi đến email của bạn');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-grow min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
                <div className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-lg">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                                Quên mật khẩu
                            </h1>
                            <p className="text-gray-500">
                                {!showResetForm
                                    ? 'Nhập địa chỉ email của bạn để nhận mã xác nhận'
                                    : 'Nhập mã xác nhận và mật khẩu mới'}
                            </p>
                        </div>

                        {!showResetForm ? (
                            <form onSubmit={handleSendCode}>
                                <div className="mb-6">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Địa chỉ Email
                                    </label>
                                    <div className="relative input-icon-container flex items-center overflow-hidden border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 bg-white transition-all duration-200">
                                        <span className="pl-4 text-gray-500">
                                            <FontAwesomeIcon icon={faUser} />
                                        </span>
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="Nhập địa chỉ email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full p-3 bg-transparent text-gray-800 focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <button
                                        type="submit"
                                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Đang xử lý...' : 'Gửi mã xác nhận'}
                                    </button>
                                </div>

                                <div className="text-center">
                                    <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                                        Quay lại trang đăng nhập
                                    </Link>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword}>
                                <div className="mb-6">
                                    <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700 mb-2">
                                        Mã xác nhận
                                    </label>
                                    <input
                                        id="resetCode"
                                        type="text"
                                        placeholder="Nhập mã 6 số"
                                        value={resetCode}
                                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-gray-800"
                                        required
                                        maxLength={6}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Mã xác nhận có hiệu lực trong 1 phút.
                                        <button
                                            type="button"
                                            onClick={handleResendCode}
                                            className={`ml-1 font-medium ${countdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-500'}`}
                                            disabled={countdown > 0}
                                        >
                                            {countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại mã'}
                                        </button>
                                    </p>
                                </div>

                                <div className="mb-6">
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        Mật khẩu mới
                                    </label>
                                    <div className="relative input-icon-container flex items-center overflow-hidden border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 bg-white transition-all duration-200">
                                        <span className="pl-4 text-gray-500">
                                            <FontAwesomeIcon icon={faLock} />
                                        </span>
                                        <input
                                            id="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Nhập mật khẩu mới"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full p-3 bg-transparent text-gray-800 focus:outline-none"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="pr-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                                        >
                                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                                    </p>
                                </div>

                                <div className="mb-6">
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        Xác nhận mật khẩu
                                    </label>
                                    <div className="relative input-icon-container flex items-center overflow-hidden border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 bg-white transition-all duration-200">
                                        <span className="pl-4 text-gray-500">
                                            <FontAwesomeIcon icon={faLock} />
                                        </span>
                                        <input
                                            id="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Nhập lại mật khẩu mới"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full p-3 bg-transparent text-gray-800 focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <button
                                        type="submit"
                                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                                    </button>
                                </div>

                                <div className="text-center">
                                    <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                                        Quay lại trang đăng nhập
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
