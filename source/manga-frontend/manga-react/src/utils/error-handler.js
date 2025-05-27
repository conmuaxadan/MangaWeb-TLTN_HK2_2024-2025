import { toast } from "react-toastify";
import { AxiosError } from "axios";

/**
 * Xử lý lỗi từ API
 * @param error Lỗi từ API
 * @param defaultMessage Thông báo mặc định nếu không có thông báo lỗi cụ thể
 */
export const handleApiError = (error, defaultMessage = "Đã xảy ra lỗi") => {
    console.error("API Error:", error);

    if (error instanceof AxiosError) {
        const axiosError = error;

        if (axiosError.response) {
            // Lỗi từ server
            const data = axiosError.response.data;
            if (data && data.message) {
                toast.error(data.message, { position: "top-right" });
                return;
            }
        }
    }

    // Nếu không có thông báo lỗi cụ thể, hiển thị thông báo mặc định
    toast.error(defaultMessage, { position: "top-right" });
};
