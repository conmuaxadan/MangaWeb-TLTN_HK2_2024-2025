import { toast } from "react-toastify";
import { mangaHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { ChapterResponse, PageResponse } from "../interfaces/models/manga";
import { logApiCall } from "../utils/api-logger";

class ChapterService {
    /**
     * Lấy danh sách chapter của translator hiện tại
     * @param page Số trang (mặc định là 0)
     * @param size Số lượng item trên mỗi trang (mặc định là 10)
     * @param keyword Từ khóa tìm kiếm (optional)
     * @returns Danh sách chapter của translator hoặc null nếu thất bại
     */
    async getMyChapters(
        page: number = 0,
        size: number = 10,
        keyword?: string
    ): Promise<PageResponse<ChapterResponse> | null> {
        logApiCall('getMyChapters');
        try {
            // Xây dựng URL với các tham số filter
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', size.toString());
            if (keyword && keyword.trim()) {
                params.append('keyword', keyword.trim());
            }
            
            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<ChapterResponse>>>(`/chapters/my-chapters?${params.toString()}`);

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

    /**
     * Lấy danh sách tất cả chapter có phân trang với khả năng lọc
     * @param page Số trang (bắt đầu từ 0, mặc định là 0)
     * @param size Số lượng item trên mỗi trang (mặc định là 10)
     * @param mangaId ID của manga để lọc (optional)
     * @returns Danh sách chapter có phân trang hoặc null nếu thất bại
     */
    async getAllChapters(
        page: number = 0,
        size: number = 10,
        mangaId?: string
    ): Promise<PageResponse<ChapterResponse> | null> {
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

            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<ChapterResponse>>>(url);
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
    async getChaptersByMangaId(mangaId: string): Promise<ChapterResponse[] | null> {
        logApiCall('getChaptersByMangaId');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<ChapterResponse[]>>(`/chapters/manga/${mangaId}`);

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
    async createChapter(formData: FormData): Promise<ChapterResponse | null> {
        logApiCall('createChapter');
        try {
            const apiResponse = await mangaHttpClient.post<ApiResponse<ChapterResponse>>('/chapters', formData, {
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
    async updateChapter(id: string, formData: FormData): Promise<ChapterResponse | null> {
        logApiCall('updateChapter');
        try {
            const apiResponse = await mangaHttpClient.put<ApiResponse<ChapterResponse>>(`/chapters/${id}`, formData, {
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
        } catch (error: any) {
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
    async deleteChapter(id: string): Promise<boolean> {
        logApiCall('deleteChapter');
        try {
            const apiResponse = await mangaHttpClient.delete<ApiResponse<void>>(`/chapters/${id}`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể xóa chapter", { position: "top-right" });
                return false;
            }

            toast.success("Xóa chapter thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi xóa chapter ID ${id}:`, error);
            toast.error("Đã xảy ra lỗi khi xóa chapter", { position: "top-right" });
            return false;
        }
    }
}

export default new ChapterService();
