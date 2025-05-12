import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import authService from "../services/auth-service.ts";
import { useAuth } from "../contexts/AuthContext.tsx";

const Authenticate = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const code = searchParams.get("code");

        if (code) {
            // Kiểm tra xem đây là yêu cầu đăng nhập hay liên kết tài khoản
            const authAction = localStorage.getItem('auth_action');

            if (authAction === 'link_google') {
                // Xử lý liên kết tài khoản Google
                handleGoogleLinking(code);
                // Xóa trạng thái sau khi xử lý
                localStorage.removeItem('auth_action');
            } else {
                // Xử lý đăng nhập bình thường
                handleGoogleCallback(code);
            }
        } else {
            toast.error("Không tìm thấy mã xác thực từ Google.", { position: "top-right" });
            navigate("/login");
        }
    }, [searchParams]);

    const handleGoogleCallback = async (code: string) => {
        try {
            const response = await authService.googleLogin(code);
            if (response !== false) {
                toast.success("Đăng nhập bằng Google thành công!", { position: "top-right", autoClose:1000 });
                login({
                    token: response.token,
                    refreshToken: response.refreshToken,
                    expiresIn: response.expiresIn
                });
                navigate("/");
            } else {
                toast.error("Đăng nhập Google thất bại.", { position: "top-right",autoClose:1000 });
                navigate("/login");
            }
        } catch (error) {
            const e = error as Error;
            toast.error(e.message, { position: "top-right" });
            navigate("/login");
        }
    };

    const handleGoogleLinking = async (code: string) => {
        try {
            // Kiểm tra xem người dùng đã đăng nhập chưa
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Bạn cần đăng nhập để liên kết tài khoản.", { position: "top-right" });
                navigate("/login");
                return;
            }

            // Gọi API liên kết tài khoản Google
            const success = await authService.linkGoogleAccount(code);

            if (success) {
                toast.success("Liên kết tài khoản Google thành công!", { position: "top-right" });
                navigate("/profile/linked-accounts");
            } else {
                toast.error("Liên kết tài khoản Google thất bại.", { position: "top-right" });
                navigate("/profile/linked-accounts");
            }
        } catch (error) {
            const e = error as Error;
            toast.error(e.message, { position: "top-right" });
            navigate("/profile/linked-accounts");
        }
    };

    return (
        <div className="flex-grow min-h-screen bg-zinc-800 flex justify-center items-center">
            <h1 className="text-white">Đang xử lý đăng nhập...</h1>
        </div>
    );
};

export default Authenticate;