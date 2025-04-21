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
            handleGoogleCallback(code);
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

    return (
        <div className="flex-grow min-h-screen bg-zinc-800 flex justify-center items-center">
            <h1 className="text-white">Đang xử lý đăng nhập...</h1>
        </div>
    );
};

export default Authenticate;