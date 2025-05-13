import { toast } from "react-toastify";
import { mangaHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { GenreRequest, GenreResponse } from "../interfaces/models/genre";
import { logApiCall } from "../utils/api-logger";
import { PageResponse } from "../interfaces/models/PageResponse";

class GenreService {
    /**
     * Lấy danh sách tất cả thể loại
     * @returns Danh sách thể loại hoặc null nếu thất bại
     */
    async getAllGenres(): Promise<GenreResponse[] | null> {
        logApiCall('getAllGenres');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<GenreResponse[]>>('/genres');

            if (apiResponse.code !== 1000) {
                console.error("Không thể lấy danh sách thể loại:", apiResponse.message);
                return null;
            }

            // Sắp xếp danh sách thể loại theo bảng chữ cái
            return apiResponse.result.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error("Lỗi lấy danh sách thể loại:", error);
            return null;
        }
    }

    /**
     * Lấy danh sách thể loại có phân trang
     * @param page Số trang
     * @param size Số lượng item trên mỗi trang
     * @returns Danh sách thể loại có phân trang hoặc null nếu thất bại
     */
    async getGenresPaginated(page: number = 0, size: number = 10): Promise<PageResponse<GenreResponse> | null> {
        logApiCall('getGenresPaginated');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<GenreResponse>>>(
                `/genres/paginated?page=${page}&size=${size}&sort=name,asc`
            );

            if (apiResponse.code !== 1000) {
                console.error("Không thể lấy danh sách thể loại phân trang:", apiResponse.message);
                return null;
            }

            // Đảm bảo sắp xếp theo bảng chữ cái nếu API không hỗ trợ sắp xếp
            const result = apiResponse.result;
            result.content = result.content.sort((a, b) => a.name.localeCompare(b.name));
            return result;
        } catch (error) {
            console.error("Lỗi lấy danh sách thể loại phân trang:", error);
            return null;
        }
    }

    /**
     * Lấy thông tin chi tiết của thể loại
     * @param name Tên thể loại
     * @returns Thông tin chi tiết thể loại hoặc null nếu thất bại
     */
    async getGenreByName(name: string): Promise<GenreResponse | null> {
        logApiCall('getGenreByName');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<GenreResponse>>(`/genres/${name}`);

            if (apiResponse.code !== 1000) {
                console.error(`Không thể lấy thông tin thể loại ${name}:`, apiResponse.message);
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin thể loại ${name}:`, error);
            return null;
        }
    }

    /**
     * Tạo thể loại mới
     * @param genreRequest Thông tin thể loại mới
     * @returns Thông tin thể loại đã tạo hoặc null nếu thất bại
     */
    async createGenre(genreRequest: GenreRequest): Promise<GenreResponse | null> {
        logApiCall('createGenre');
        try {
            const apiResponse = await mangaHttpClient.post<ApiResponse<GenreResponse>>('/genres', genreRequest);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể tạo thể loại", { position: "top-right" });
                return null;
            }

            toast.success("Tạo thể loại thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi tạo thể loại:", error);
            toast.error("Đã xảy ra lỗi khi tạo thể loại", { position: "top-right" });
            return null;
        }
    }

    /**
     * Cập nhật thể loại
     * @param name Tên thể loại cần cập nhật
     * @param genreRequest Thông tin thể loại cần cập nhật
     * @returns Thông tin thể loại đã cập nhật hoặc null nếu thất bại
     */
    async updateGenre(name: string, genreRequest: GenreRequest): Promise<GenreResponse | null> {
        logApiCall('updateGenre');
        try {
            const apiResponse = await mangaHttpClient.put<ApiResponse<GenreResponse>>(`/genres/${name}`, genreRequest);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể cập nhật thể loại", { position: "top-right" });
                return null;
            }

            toast.success("Cập nhật thể loại thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi cập nhật thể loại ${name}:`, error);
            toast.error("Đã xảy ra lỗi khi cập nhật thể loại", { position: "top-right" });
            return null;
        }
    }

    /**
     * Xóa thể loại
     * @param name Tên thể loại cần xóa
     * @returns true nếu thành công, false nếu thất bại
     */
    async deleteGenre(name: string): Promise<boolean> {
        logApiCall('deleteGenre');
        try {
            const apiResponse = await mangaHttpClient.delete<ApiResponse<void>>(`/genres/${name}`);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể xóa thể loại", { position: "top-right" });
                return false;
            }

            toast.success("Xóa thể loại thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi xóa thể loại ${name}:`, error);
            toast.error("Đã xảy ra lỗi khi xóa thể loại", { position: "top-right" });
            return false;
        }
    }
}

export default new GenreService();
