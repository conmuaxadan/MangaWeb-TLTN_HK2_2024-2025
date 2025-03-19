import axios, { AxiosInstance, AxiosError } from "axios";
import { toast } from "react-toastify";
import {OAuthConfig} from "../configurations/configuration.ts";

interface LoginResponse {
    token: string;
    authenticated: boolean;
}

class AuthService {
    api: AxiosInstance;
    constructor() {
        this.api = axios.create({
            baseURL: "http://localhost:8080/identity/auth",
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        });
    }

    async login(username: string, password: string): Promise<LoginResponse | false> {
        try {
            const response = await this.api.post("/login", {username, password});
            console.log("Response từ server:", response);

            // Kiểm tra code thay vì status, giả sử code 1000 là thành công
            if (response.data.code !== 1000) {
                toast.error(response.data.message || "Đăng nhập thất bại", {position: "top-right"});
                return false;
            }

            // Truy cập result thay vì data
            const result = response.data.result;
            if (!result || !result.authenticated) {
                toast.error("Xác thực thất bại", {position: "top-right"});
                return false;
            }

            return result; // Trả về { token, authenticated }
        } catch (error) {
            const axiosError = error as AxiosError;
            console.error("Lỗi từ server:", axiosError.response);
            return false;
        }
    }

    async googleLogin(code: string): Promise<LoginResponse | false> {
        try {
            const response = await this.api.post("/google-login", {
                code,
                redirectUri: OAuthConfig.redirectUri,
            });
            console.log("Response từ Google login:", response);

            if (response.data.code !== 1000) {
                toast.error(response.data.message || "Đăng nhập Google thất bại", { position: "top-right" });
                return false;
            }

            const result = response.data.result;
            if (!result || !result.authenticated) {
                toast.error("Xác thực Google thất bại", { position: "top-right" });
                return false;
            }

            return result; // Trả về { token, authenticated }
        } catch (error) {
            const axiosError = error as AxiosError;
            console.error("Lỗi từ server (Google login):", axiosError.response);
            return false;
        }
    }


}




export default new AuthService();