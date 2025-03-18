import authService from "../services/auth-service.ts";
import {FormEvent, useState} from "react";
import {toast} from "react-toastify";
import {useNavigate} from "react-router-dom";
import {saveString} from "../utils/localStorageUtil.ts";


const Login = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await authService.login(username, password);
            if (response !== false) { // response sẽ là LoginResponse hoặc false
                toast.success("Đăng nhập thành công!", { position: "top-right" });
                console.log("Token:", response.token);
                saveString("token", response.token);
                navigate("/");
            } else {
                console.log("Đăng nhập thất bại");
            }
        } catch (error) {
            console.error("Lỗi không mong muốn:", error);
            toast.error("Đã xảy ra lỗi. Vui lòng thử lại.", { position: "top-right" });
        }
    };
    return (
        <div className="flex-grow min-h-screen bg-zinc-800">
            <div className="min-h-screen w-full flex justify-center items-center">
                <div className="max-w-screen-md md:w-5/12 m-4 p-8">
                    <div className="w-full flex justify-center">
                        <h1 className="text-xl font-bold text-white mb-12 font-head">
                            Đăng nhập
                        </h1>
                    </div>
                    <form onSubmit={handleSubmit}>
                        {/* Tên đăng nhập */}
                        <div className="mb-8">
                            <label htmlFor="username" className="block text-white">
                                Tên đăng nhập
                            </label>
                            <input
                                id="username"
                                type="text"
                                placeholder="Tên đăng nhập"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full mt-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                            />
                        </div>

                        {/* Mật khẩu */}
                        <div className="mb-8">
                            <label htmlFor="password" className="block text-white">
                                Mật khẩu
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full mt-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                            />
                        </div>

                        {/* Ghi nhớ mật khẩu */}
                        <div className="mb-8 flex items-center">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                className="mr-2"
                            />
                            <label htmlFor="rememberMe" className="text-white">
                                Ghi nhớ mật khẩu
                            </label>
                        </div>

                        {/* Nút Đăng nhập */}
                        <div className="w-full flex justify-center mb-8">
                            <button
                                type="submit"
                                className="px-8 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                                Đăng nhập
                            </button>
                        </div>

                        {/* Liên kết */}
                        <div className="flex flex-col md:flex-row justify-center gap-4">
                            <a
                                href="/request-reset-password"
                                className="text-sm font-bold text-blue-500 hover:text-blue-700 transition"
                            >
                                Quên mật khẩu?
                            </a>
                            <a
                                href="/register"
                                className="text-sm font-bold text-blue-500 hover:text-blue-700 transition"
                            >
                                Đăng ký tài khoản
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
export default Login;