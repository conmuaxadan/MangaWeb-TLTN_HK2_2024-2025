import { toast } from "react-toastify";
import { mangaHttpClient } from "./http-client.js";
import { logApiCall } from "../utils/api-logger.js";

class GenreService {
    /**
     * Lấy danh sách tất cả thể loại
     * @returns Danh sách thể loại hoặc null nếu thất bại
     */
    async getAllGenres() {
        logApiCall('getAllGenres');
        try {
            const apiResponse = await mangaHttpClient.get('/genres');

            if (apiResponse.code !== 200) {
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
     * Tạo thể loại mới
     * @param genreRequest Thông tin thể loại mới
     * @returns Thông tin thể loại đã tạo hoặc null nếu thất bại
     */
    async createGenre(genreRequest) {
        logApiCall('createGenre');
        try {
            const apiResponse = await mangaHttpClient.post('/genres', genreRequest);

            if (apiResponse.code !== 201) {
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
     * @param id ID thể loại cần cập nhật
     * @param genreRequest Thông tin thể loại cần cập nhật
     * @returns Thông tin thể loại đã cập nhật hoặc null nếu thất bại
     */
    async updateGenreById(id, genreRequest) {
        logApiCall('updateGenreById');
        try {
            const apiResponse = await mangaHttpClient.put(`/genres/${id}`, genreRequest);

            if (apiResponse.code !== 200) {
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
     * @param id ID thể loại cần xóa
     * @returns true nếu thành công, false nếu thất bại
     */
    async deleteGenreById(id) {
        logApiCall('deleteGenreById');
        try {
            await mangaHttpClient.delete(`/genres/${id}`);
            toast.success("Xóa thể loại thành công", { position: "top-right" });
            return true;
        } catch (error) {
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
