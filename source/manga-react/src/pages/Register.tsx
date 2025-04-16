import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import authService from "../services/auth-service.ts";

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Kiểm tra các trường dữ liệu
        if (!username || !email || !password || !confirmPassword) {
            toast.error("Vui lòng điền đầy đủ thông tin", { position: "top-right" });
            return;
        }

        // Kiểm tra tên người dùng
        if (username.length < 5) {
            toast.error("Tên đăng nhập phải có ít nhất 5 ký tự", { position: "top-right" });
            return;
        }

        const usernameRegex = /^[a-zA-Z0-9._-]+$/;
        if (!usernameRegex.test(username)) {
            toast.error("Tên đăng nhập chỉ được chứa chữ cái, số, dấu chấm, gạch dưới và gạch ngang", { position: "top-right" });
            return;
        }

        // Kiểm tra định dạng email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Định dạng email không hợp lệ", { position: "top-right" });
            return;
        }

        // Kiểm tra mật khẩu
        if (password.length < 8) {
            toast.error("Mật khẩu phải có ít nhất 8 ký tự", { position: "top-right" });
            return;
        }

        const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$/;
        if (!passwordRegex.test(password)) {
            toast.error("Mật khẩu phải có ít nhất một chữ số, một chữ thường, một chữ hoa và một ký tự đặc biệt (@#$%^&+=)", { position: "top-right" });
            return;
        }

        // Kiểm tra mật khẩu xác nhận
        if (password !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp", { position: "top-right" });
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
        <div className="flex-grow min-h-screen bg-zinc-800">
            <div className="min-h-screen w-full flex justify-center items-center">
                <div className="max-w-screen-md md:w-5/12 m-4 p-8">
                    <div className="w-full flex justify-center">
                        <h1 className="text-xl font-bold text-white mb-12 font-head">
                            Đăng ký
                        </h1>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-8">
                            <label htmlFor="username" className="block text-white">
                                Tên đăng nhập
                            </label>
                            <input
                                id="username"
                                type="text"
                                placeholder="Tên đăng nhập"
                                className="w-full mt-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-8">
                            <label htmlFor="email" className="block text-white">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Email"
                                className="w-full mt-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-8">
                            <label htmlFor="password" className="block text-white">
                                Mật khẩu
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Mật khẩu"
                                className="w-full mt-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="mb-8">
                            <label htmlFor="re-password" className="block text-white">
                                Nhập lại mật khẩu
                            </label>
                            <input
                                id="re-password"
                                type="password"
                                placeholder="Nhập lại mật khẩu"
                                className="w-full mt-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="w-full flex justify-center mb-8">
                            <button
                                type="submit"
                                className="px-8 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                                disabled={isLoading}
                            >
                                {isLoading ? "Đang xử lý..." : "Đăng ký"}
                            </button>
                        </div>
                    </form>
                    <div className="text-center mt-4">
                        <p className="text-white">
                            Đã có tài khoản?{" "}
                            <a href="/manga-react/src/pages/Login" className="text-blue-400 hover:underline">
                                Đăng nhập ngay
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Register;