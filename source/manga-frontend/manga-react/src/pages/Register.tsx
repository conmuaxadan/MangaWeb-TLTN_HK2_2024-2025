import { useState, FormEvent, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import authService from "../services/auth-service.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Error states
    const [usernameError, setUsernameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");

    // Validation states
    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);

    // Touched states (to show errors only after user interaction)
    const [usernameTouched, setUsernameTouched] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

    const navigate = useNavigate();

    // Animation effect when component mounts
    useEffect(() => {
        document.querySelector('.register-container')?.classList.add('fade-in');
    }, []);

    // Validate username
    const validateUsername = (value: string) => {
        if (!value) {
            setUsernameError("Tên đăng nhập không được để trống");
            setIsUsernameValid(false);
            return false;
        }

        if (value.length < 6) {
            setUsernameError("Tên đăng nhập phải có ít nhất 6 ký tự");
            setIsUsernameValid(false);
            return false;
        }

        const usernameRegex = /^[a-z0-9]+$/;
        if (!usernameRegex.test(value)) {
            setUsernameError("Tên đăng nhập chỉ được chứa chữ thường và số");
            setIsUsernameValid(false);
            return false;
        }

        setUsernameError("");
        setIsUsernameValid(true);
        return true;
    };

    // Validate email
    const validateEmail = (value: string) => {
        if (!value) {
            setEmailError("Email không được để trống");
            setIsEmailValid(false);
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            setEmailError("Định dạng email không hợp lệ");
            setIsEmailValid(false);
            return false;
        }

        setEmailError("");
        setIsEmailValid(true);
        return true;
    };

    // Validate password
    const validatePassword = (value: string) => {
        if (!value) {
            setPasswordError("Mật khẩu không được để trống");
            setIsPasswordValid(false);
            return false;
        }

        if (value.length < 8) {
            setPasswordError("Mật khẩu phải có ít nhất 8 ký tự");
            setIsPasswordValid(false);
            return false;
        }

        const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$/;
        if (!passwordRegex.test(value)) {
            setPasswordError("Mật khẩu phải có ít nhất một chữ số, một chữ thường, một chữ hoa và một ký tự đặc biệt (@#$%^&+=)");
            setIsPasswordValid(false);
            return false;
        }

        setPasswordError("");
        setIsPasswordValid(true);
        return true;
    };

    // Validate confirm password
    const validateConfirmPassword = (value: string) => {
        if (!value) {
            setConfirmPasswordError("Vui lòng xác nhận mật khẩu");
            setIsConfirmPasswordValid(false);
            return false;
        }

        if (value !== password) {
            setConfirmPasswordError("Mật khẩu xác nhận không khớp");
            setIsConfirmPasswordValid(false);
            return false;
        }

        setConfirmPasswordError("");
        setIsConfirmPasswordValid(true);
        return true;
    };

    // Handle input changes with validation
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUsername(value);
        if (usernameTouched) {
            validateUsername(value);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        if (emailTouched) {
            validateEmail(value);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        if (passwordTouched) {
            validatePassword(value);
        }
        // Also validate confirm password if it's already been entered
        if (confirmPasswordTouched && confirmPassword) {
            validateConfirmPassword(confirmPassword);
        }
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setConfirmPassword(value);
        if (confirmPasswordTouched) {
            validateConfirmPassword(value);
        }
    };

    // Handle blur events to set touched state
    const handleUsernameBlur = () => {
        setUsernameTouched(true);
        validateUsername(username);
    };

    const handleEmailBlur = () => {
        setEmailTouched(true);
        validateEmail(email);
    };

    const handlePasswordBlur = () => {
        setPasswordTouched(true);
        validatePassword(password);
    };

    const handleConfirmPasswordBlur = () => {
        setConfirmPasswordTouched(true);
        validateConfirmPassword(confirmPassword);
    };



    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Set all fields as touched
        setUsernameTouched(true);
        setEmailTouched(true);
        setPasswordTouched(true);
        setConfirmPasswordTouched(true);

        // Validate all fields
        const isUsernameValidNow = validateUsername(username);
        const isEmailValidNow = validateEmail(email);
        const isPasswordValidNow = validatePassword(password);
        const isConfirmPasswordValidNow = validateConfirmPassword(confirmPassword);

        // If any validation fails, return early
        if (!isUsernameValidNow || !isEmailValidNow || !isPasswordValidNow || !isConfirmPasswordValidNow) {
            return;
        }

        try {
            setIsLoading(true);
            const result = await authService.register(username, password, email);

            if (result) {
                // Đăng ký thành công, chuyển hướng đến trang đăng nhập
                navigate("/login");
            }
        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            toast.error("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.", { position: "top-right" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-grow min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in {
                    animation: fadeIn 0.6s ease-out forwards;
                }
                .register-container {
                    opacity: 0;
                }
                .input-icon-container:focus-within {
                    border-color: #8b5cf6;
                    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
                }

                .error-message {
                    animation: fadeIn 0.3s ease-out;
                }
                .input-error {
                    border-color: #ef4444;
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-2px, 0, 0); }
                    40%, 60% { transform: translate3d(2px, 0, 0); }
                }
            `}</style>

            <div className="min-h-screen w-full flex justify-center items-center">
                <div className="register-container w-full max-w-md bg-white rounded-xl overflow-hidden shadow-lg backdrop-blur-sm">
                    {/* Register form */}
                    <div className="p-6 sm:p-10 flex flex-col justify-center">
                        <div className="mb-8 text-center">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                                Đăng ký tài khoản
                            </h1>
                            <p className="text-gray-500">Tạo tài khoản mới để trải nghiệm đầy đủ tính năng</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Tên đăng nhập */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên đăng nhập
                                </label>
                                <div className="relative input-icon-container flex items-center overflow-hidden border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 bg-white transition-all duration-200">
                                    <span className="pl-4 text-gray-500">
                                        <FontAwesomeIcon icon={faUser} />
                                    </span>
                                    <input
                                        id="username"
                                        type="text"
                                        placeholder="Nhập tên đăng nhập"
                                        value={username}
                                        onChange={handleUsernameChange}
                                        onBlur={handleUsernameBlur}
                                        className={`w-full p-3 bg-transparent text-gray-800 focus:outline-none ${usernameTouched && usernameError ? 'border-red-500 input-error' : ''}`}
                                        required
                                    />
                                </div>
                                {usernameTouched && usernameError ? (
                                    <p className="text-xs text-red-400 mt-1 error-message">{usernameError}</p>
                                ) : (
                                    <p className="text-xs text-gray-500 mt-1">Tên đăng nhập phải có ít nhất 6 ký tự, chỉ chứa chữ thường và số</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <div className="relative input-icon-container flex items-center overflow-hidden border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 bg-white transition-all duration-200">
                                    <span className="pl-4 text-gray-500">
                                        <FontAwesomeIcon icon={faEnvelope} />
                                    </span>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="Nhập địa chỉ email"
                                        value={email}
                                        onChange={handleEmailChange}
                                        onBlur={handleEmailBlur}
                                        className={`w-full p-3 bg-transparent text-gray-800 focus:outline-none ${emailTouched && emailError ? 'border-red-500 input-error' : ''}`}
                                        required
                                    />
                                </div>
                                {emailTouched && emailError ? (
                                    <p className="text-xs text-red-400 mt-1 error-message">{emailError}</p>
                                ) : (
                                    <p className="text-xs text-gray-500 mt-1">Chúng tôi sẽ không chia sẻ email của bạn với bất kỳ ai</p>
                                )}
                            </div>

                            {/* Mật khẩu */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Mật khẩu
                                </label>
                                <div className="relative input-icon-container flex items-center overflow-hidden border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 bg-white transition-all duration-200">
                                    <span className="pl-4 text-gray-500">
                                        <FontAwesomeIcon icon={faLock} />
                                    </span>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Nhập mật khẩu"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        onBlur={handlePasswordBlur}
                                        className={`w-full p-3 bg-transparent text-gray-800 focus:outline-none ${passwordTouched && passwordError ? 'border-red-500 input-error' : ''}`}
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="pr-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                                    >
                                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                    </button>
                                </div>


                                {passwordTouched && passwordError ? (
                                    <p className="text-xs text-red-400 mt-1 error-message">{passwordError}</p>
                                ) : (
                                    <p className="text-xs text-gray-500 mt-1">Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt</p>
                                )}
                            </div>

                            {/* Nhập lại mật khẩu */}
                            <div>
                                <label htmlFor="re-password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Nhập lại mật khẩu
                                </label>
                                <div className="relative input-icon-container flex items-center overflow-hidden border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 bg-white transition-all duration-200">
                                    <span className="pl-4 text-gray-500">
                                        <FontAwesomeIcon icon={faLock} />
                                    </span>
                                    <input
                                        id="re-password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Nhập lại mật khẩu"
                                        value={confirmPassword}
                                        onChange={handleConfirmPasswordChange}
                                        onBlur={handleConfirmPasswordBlur}
                                        className={`w-full p-3 bg-transparent text-gray-800 focus:outline-none ${confirmPasswordTouched && confirmPasswordError ? 'border-red-500 input-error' : ''}`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="pr-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                                    >
                                        <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                                    </button>
                                </div>
                                {confirmPasswordTouched && confirmPasswordError ? (
                                    <p className="text-xs text-red-400 mt-1 error-message">{confirmPasswordError}</p>
                                ) : confirmPassword && password !== confirmPassword && (
                                    <p className="text-xs text-red-400 mt-1 error-message">Mật khẩu không khớp</p>
                                )}
                            </div>

                            {/* Nút Đăng ký */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-100 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg"
                                    disabled={isLoading || !isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xử lý...
                                        </span>
                                    ) : "Đăng ký"}
                                </button>
                            </div>

                            {/* Login link */}
                            <div className="text-center mt-6">
                                <p className="text-gray-500">
                                    Đã có tài khoản?{" "}
                                    <Link to="/login" className="text-purple-600 hover:text-purple-500 font-medium transition-colors">
                                        Đăng nhập ngay
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Register;