import { toast } from "react-toastify";
import { mangaHttpClient } from "./http-client.js";
import { logApiCall } from "../utils/api-logger.js";

class ChapterService {

    async getMyChapters(page = 0, size = 10, keyword) {
        logApiCall('getMyChapters');
        try {
            // Xây dựng URL với các tham số filter
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', size.toString());
            if (keyword && keyword.trim()) {
                params.append('keyword', keyword.trim());
            }
            
            const apiResponse = await mangaHttpClient.get(`/chapters/my-chapters?${params.toString()}`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách chương của bạn", { position: "top-right" });
                return null;
            }
            
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách chương của tôi:", error);
            return null;
        }
    }
    
    async getAllChapters(page = 0, size = 10, mangaId) {
        logApiCall('getAllChapters');
        try {
            // Xây dựng URL với các tham số filter
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', size.toString());

            if (mangaId && mangaId.trim()) {
                params.append('mangaId', mangaId.trim());
            }

            const url = `/chapters?${params.toString()}`;
            console.log('Gọi API: GET', url);
            console.log('Params object:', { page, size, mangaId });

            const apiResponse = await mangaHttpClient.get(url);
            console.log('Kết quả API getAllChapters:', apiResponse);

            if (apiResponse.code !== 200) {
                console.error("Không thể lấy danh sách chapter:", apiResponse.message);
                return null;
            }

            console.log('Dữ liệu phân trang chapter:', apiResponse.result);
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách chapter:", error);
            return null;
        }
    }

    /**
     * Lấy danh sách chapter của một truyện
     * @param mangaId ID của truyện
     * @returns Danh sách chapter hoặc null nếu thất bại
     */
    async getChaptersByMangaId(mangaId) {
        logApiCall('getChaptersByMangaId');
        try {
            const apiResponse = await mangaHttpClient.get(`/chapters/manga/${mangaId}`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách chapter", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy danh sách chapter của manga ID ${mangaId}:`, error);
            return null;
        }
    }

    /**
     * Tạo chapter mới
     * @param formData FormData chứa thông tin chapter mới
     * @returns Thông tin chapter đã tạo hoặc null nếu thất bại
     */
    async createChapter(formData) {
        logApiCall('createChapter');
        try {
            const apiResponse = await mangaHttpClient.post('/chapters', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (apiResponse.code !== 201) {
                toast.error(apiResponse.message || "Không thể tạo chapter mới", { position: "top-right" });
                return null;
            }

            toast.success("Tạo chapter mới thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi tạo chapter mới:", error);
            toast.error("Đã xảy ra lỗi khi tạo chapter mới", { position: "top-right" });
            return null;
        }
    }

    /**
     * Cập nhật chapter
     * @param id ID của chapter cần cập nhật
     * @param formData FormData chứa thông tin cập nhật
     * @returns Thông tin chapter đã cập nhật hoặc null nếu thất bại
     */
    async updateChapter(id, formData) {
        logApiCall('updateChapter');
        try {
            const apiResponse = await mangaHttpClient.put(`/chapters/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể cập nhật chapter", { position: "top-right" });
                return null;
            }

            toast.success("Cập nhật chapter thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi cập nhật chapter ID ${id}:`, error);

            // Hiển thị thông báo lỗi chi tiết hơn
            let errorMessage = "Đã xảy ra lỗi khi cập nhật chapter";
            if (error.response) {
                // Nếu có response từ server
                if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else {
                    errorMessage += ` (${error.response.status}: ${error.response.statusText})`;
                }
            } else if (error.request) {
                // Nếu request đã được gửi nhưng không nhận được response
                errorMessage += " (Không nhận được phản hồi từ server)";
            } else {
                // Lỗi khi thiết lập request
                errorMessage += ` (${error.message})`;
            }

            toast.error(errorMessage, { position: "top-right" });
            return null;
        }
    }

    /**
     * Xóa chapter
     * @param id ID của chapter cần xóa
     * @returns true nếu thành công, false nếu thất bại
     */
    async deleteChapter(id) {
        logApiCall('deleteChapter');
        try {
            console.log(`Attempting to delete chapter with ID: ${id}`);
            const apiResponse = await mangaHttpClient.delete(`/chapters/${id}`);
            console.log(`Delete chapter response:`, apiResponse);

            if (apiResponse.code !== 200) {
                console.error(`Delete chapter failed with code ${apiResponse.code}:`, apiResponse.message);
                toast.error(apiResponse.message || "Không thể xóa chapter", { position: "top-right" });
                return false;
            }

            toast.success("Xóa chapter thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi xóa chapter ID ${id}:`, error);
            console.error(`Error response:`, error.response);
            console.error(`Error status:`, error.response?.status);
            console.error(`Error data:`, error.response?.data);

            // Hiển thị thông báo lỗi chi tiết hơn
            let errorMessage = "Đã xảy ra lỗi khi xóa chapter";

            if (error.response?.data) {
                // Nếu có response data từ backend
                if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                } else if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                }
            } else {
                // Fallback dựa trên status code
                switch (error.response?.status) {
                    case 400:
                        errorMessage = "Yêu cầu không hợp lệ. Chapter có thể đang được sử dụng hoặc có lỗi dữ liệu.";
                        break;
                    case 401:
                        errorMessage = "Bạn cần đăng nhập để thực hiện thao tác này.";
                        break;
                    case 403:
                        errorMessage = "Bạn không có quyền xóa chapter này.";
                        break;
                    case 404:
                        errorMessage = "Chapter không tồn tại hoặc đã bị xóa.";
                        break;
                    case 500:
                        errorMessage = "Lỗi server. Vui lòng thử lại sau.";
                        break;
                    default:
                        errorMessage = `Lỗi không xác định (${error.response?.status || 'Unknown'})`;
                }
            }

            toast.error(errorMessage, { position: "top-right" });
            return false;
        }
    }

    /**
     * Xóa một trang của chapter
     * @param chapterId ID của chapter
     * @param pageIndex Index của trang cần xóa
     * @returns Thông tin chapter đã cập nhật hoặc null nếu thất bại
     */
    async deleteChapterPage(chapterId, pageIndex) {
        logApiCall('deleteChapterPage');
        try {
            const apiResponse = await mangaHttpClient.delete(`/chapters/${chapterId}/pages/${pageIndex}`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể xóa trang", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi xóa trang ${pageIndex} của chapter ID ${chapterId}:`, error);
            toast.error("Đã xảy ra lỗi khi xóa trang", { position: "top-right" });
            return null;
        }
    }

    /**
     * Cập nhật một trang của chapter
     * @param chapterId ID của chapter
     * @param pageIndex Index của trang cần cập nhật
     * @param pageFile File trang mới
     * @returns Thông tin chapter đã cập nhật hoặc null nếu thất bại
     */
    async updateChapterPage(chapterId, pageIndex, pageFile) {
        logApiCall('updateChapterPage');
        try {
            const formData = new FormData();
            formData.append('page', pageFile);

            const apiResponse = await mangaHttpClient.put(`/chapters/${chapterId}/pages/${pageIndex}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể cập nhật trang", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi cập nhật trang ${pageIndex} của chapter ID ${chapterId}:`, error);
            toast.error("Đã xảy ra lỗi khi cập nhật trang", { position: "top-right" });
            return null;
        }
    }
}

export default new ChapterService();
