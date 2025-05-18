import { toast } from "react-toastify";
import { mangaHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { GenreRequest, GenreResponse } from "../interfaces/models/genre";
import { logApiCall } from "../utils/api-logger";

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

            // Log dữ liệu trả về để kiểm tra
            console.log("Dữ liệu thể loại trả về từ API:", apiResponse.result);

            // Sắp xếp danh sách thể loại theo bảng chữ cái
            return apiResponse.result.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error("Lỗi lấy danh sách thể loại:", error);
            return null;
        }
    }


    /**
     * Lấy thông tin chi tiết của thể loại
     * @param name Tên thể loại
     * @returns Thông tin chi tiết thể loại hoặc null nếu thất bại
     */
    async getGenreById(id: number): Promise<GenreResponse | null> {
        logApiCall('getGenreById');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<GenreResponse>>(`/genres/${id}`);

            if (apiResponse.code !== 1000) {
                console.error(`Không thể lấy thông tin thể loại với ID ${id}:`, apiResponse.message);
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin thể loại với ID ${id}:`, error);
            return null;
        }
    }

    async getGenreByName(name: string): Promise<GenreResponse | null> {
        logApiCall('getGenreByName');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<GenreResponse>>(`/genres/name/${name}`);

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
    async updateGenreById(id: number, genreRequest: GenreRequest): Promise<GenreResponse | null> {
        logApiCall('updateGenreById');
        try {
            const apiResponse = await mangaHttpClient.put<ApiResponse<GenreResponse>>(`/genres/${id}`, genreRequest);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể cập nhật thể loại", { position: "top-right" });
                return null;
            }

            toast.success("Cập nhật thể loại thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi cập nhật thể loại với ID ${id}:`, error);
            toast.error("Đã xảy ra lỗi khi cập nhật thể loại", { position: "top-right" });
            return null;
        }
    }



    /**
     * Xóa thể loại
     * @param name Tên thể loại cần xóa
     * @returns true nếu thành công, false nếu thất bại
     */
    async deleteGenreById(id: number): Promise<boolean> {
        logApiCall('deleteGenreById');
        try {
           await mangaHttpClient.delete<ApiResponse<void>>(`/genres/${id}`);
            toast.success("Xóa thể loại thành công", { position: "top-right" });
            return true;
        } catch (error:any) {
            console.error(`Lỗi xóa thể loại với ID ${id}:`, error);

            // Hiển thị thông báo lỗi từ backend nếu có
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message, { position: "top-right" });
            } else {
                toast.error("Đã xảy ra lỗi khi xóa thể loại", { position: "top-right" });
            }

            return false;
        }
    }


}

export default new GenreService();
