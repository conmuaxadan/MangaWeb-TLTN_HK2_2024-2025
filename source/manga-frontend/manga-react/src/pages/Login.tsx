import authService from "../services/auth-service.ts";
import {FormEvent, useState, useEffect} from "react";
import {toast} from "react-toastify";
import {useNavigate, Link} from "react-router-dom";
import {OAuthConfig} from "../configurations/configuration.ts";
import { useAuth } from "../contexts/AuthContext.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";


const Login = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    // Animation effect when component mounts
    useEffect(() => {
        document.querySelector('.login-container')?.classList.add('fade-in');
    }, []);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Kiểm tra các trường dữ liệu
        if (!username || !password) {
            toast.error("Vui lòng điền đầy đủ thông tin", { position: "top-right" });
            return;
        }

        try {
            setIsLoading(true);
            const response = await authService.login(username, password);
            if (response !== false) { // response sẽ là LoginResponse hoặc false
                toast.success("Đăng nhập thành công!", { position: "top-right" });
                console.log("Token:", response.token);
                login({
                    token: response.token,
                    refreshToken: response.refreshToken,
                    expiresIn: response.expiresIn
                });
                navigate("/");
            } else {
                console.log("Đăng nhập thất bại");
            }
        } catch (error) {
            console.error("Lỗi không mong muốn:", error);
            toast.error("Đã xảy ra lỗi. Vui lòng thử lại.", { position: "top-right" });
        } finally {
            setIsLoading(false);
        }
    };
    const handleGoogleLogin = () => {
        const scope = encodeURIComponent("email profile"); // Các scope bạn muốn
        window.location.href = `${OAuthConfig.authUri}?client_id=${OAuthConfig.clientId}&redirect_uri=${OAuthConfig.redirectUri}&response_type=code&scope=${scope}`; // Redirect tới Google
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
                .login-container {
                    opacity: 0;
                }
                .input-icon-container:focus-within {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
                }
                .social-login-btn {
                    transition: transform 0.2s;
                }
                .social-login-btn:hover {
                    transform: translateY(-2px);
                }
            `}</style>

            <div className="min-h-screen w-full flex justify-center items-center">
                <div className="login-container w-full max-w-md bg-white rounded-xl overflow-hidden shadow-lg backdrop-blur-sm">
                    {/* Login form */}
                    <div className="p-6 sm:p-10 flex flex-col justify-center">
                        <div className="mb-8 text-center">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                                Đăng nhập
                            </h1>
                            <p className="text-gray-500">Nhập thông tin đăng nhập của bạn để tiếp tục</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Tên đăng nhập hoặc Email */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên đăng nhập hoặc Email
                                </label>
                                <div className="relative input-icon-container flex items-center overflow-hidden border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 bg-white transition-all duration-200">
                                    <span className="pl-4 text-gray-500">
                                        <FontAwesomeIcon icon={faUser} />
                                    </span>
                                    <input
                                        id="username"
                                        type="text"
                                        placeholder="Nhập tên đăng nhập hoặc email"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full p-3 bg-transparent text-gray-800 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Mật khẩu */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Mật khẩu
                                </label>
                                <div className="relative input-icon-container flex items-center overflow-hidden border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 bg-white transition-all duration-200">
                                    <span className="pl-4 text-gray-500">
                                        <FontAwesomeIcon icon={faLock} />
                                    </span>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Nhập mật khẩu"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-3 bg-transparent text-gray-800 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="pr-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                                    >
                                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                    </button>
                                </div>
                            </div>

                            {/* Quên mật khẩu */}
                            <div className="flex items-center justify-end">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                                >
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            {/* Nút Đăng nhập */}
                            <div>
                                <button
                                    type="submit"
                                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xử lý...
                                        </span>
                                    ) : "Đăng nhập"}
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập với</span>
                                </div>
                            </div>

                            {/* Social Login */}
                            <div>
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="social-login-btn w-full py-3 px-4 bg-white text-gray-800 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-100 transition-all duration-200 shadow-md"
                                    disabled={isLoading}
                                >
                                    <FontAwesomeIcon icon={faGoogle} className="text-red-500" />
                                    Đăng nhập bằng Google
                                </button>
                            </div>

                            {/* Register link */}
                            <div className="text-center mt-6">
                                <p className="text-gray-500">
                                    Chưa có tài khoản?{" "}
                                    <Link to="/register" className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors">
                                        Đăng ký ngay
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Login;