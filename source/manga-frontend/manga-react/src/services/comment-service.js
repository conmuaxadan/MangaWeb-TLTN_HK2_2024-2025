import { toast } from "react-toastify";
import { commentHttpClient } from "./http-client.js";
import { logApiCall } from "../utils/api-logger.js";

class CommentService {
    /**
     * Tạo bình luận mới
     * @param mangaId ID của manga
     * @param chapterId ID của chapter
     * @param content Nội dung bình luận
     * @returns Thông tin bình luận đã tạo hoặc null nếu thất bại
     */
    async createComment(mangaId, chapterId, content) {
        logApiCall('createComment');
        try {
            const request = {
                mangaId,
                chapterId,
                content
            };

            const apiResponse = await commentHttpClient.post('/comments', request);

            if (apiResponse.code !== 201) {
                toast.error(apiResponse.message || "Không thể tạo bình luận", { position: "top-right" });
                return null;
            }

            toast.success("Bình luận đã được đăng thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi tạo bình luận:`, error);
            toast.error("Không thể tạo bình luận", { position: "top-right" });
            return null;
        }
    }

    /**
     * Lấy danh sách bình luận theo chapterId
     * @param chapterId ID của chapter
     * @param page Số trang
     * @param size Số lượng bình luận mỗi trang
     * @returns Danh sách bình luận có phân trang hoặc null nếu thất bại
     */
    async getCommentsByChapterId(chapterId, page = 0, size = 20) {
        logApiCall('getCommentsByChapterId');
        try {
            const apiResponse = await commentHttpClient.get(
                `/comments/chapters/${chapterId}?page=${page}&size=${size}&sort=createdAt,desc`
            );

            if (apiResponse.code !== 200) {
                console.error(apiResponse.message || "Không thể lấy danh sách bình luận");
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy danh sách bình luận của chapter ID ${chapterId}:`, error);
            return null;
        }
    }

    /**
     * Lấy danh sách bình luận theo mangaId
     * @param mangaId ID của manga
     * @param page Số trang
     * @param size Số lượng bình luận mỗi trang
     * @returns Danh sách bình luận có phân trang hoặc null nếu thất bại
     */
    async getCommentsByMangaId(mangaId, page = 0, size = 20) {
        logApiCall('getCommentsByMangaId');
        try {
            const apiResponse = await commentHttpClient.get(
                `/comments/mangas/${mangaId}?page=${page}&size=${size}&sort=createdAt,desc`
            );

            if (apiResponse.code !== 200) {
                console.error(apiResponse.message || "Không thể lấy danh sách bình luận");
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy danh sách bình luận của manga ID ${mangaId}:`, error);
            return null;
        }
    }

    /**
     * Lấy danh sách bình luận của người dùng hiện tại
     * @param page Số trang
     * @param size Số lượng bình luận mỗi trang
     * @returns Danh sách bình luận có phân trang hoặc null nếu thất bại
     */
    async getMyComments(page = 0, size = 20) {
        logApiCall('getMyComments');
        try {
            const apiResponse = await commentHttpClient.get(
                `/comments/me?page=${page}&size=${size}&sort=createdAt,desc`
            );

            if (apiResponse.code !== 200) {
                console.error(apiResponse.message || "Không thể lấy danh sách bình luận của bạn");
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy danh sách bình luận của bạn:`, error);
            return null;
        }
    }

    /**
     * Lấy danh sách bình luận mới nhất
     * @param limit Số lượng bình luận cần lấy
     * @returns Danh sách bình luận mới nhất hoặc null nếu thất bại
     */
    async getLatestComments(limit = 10) {
        logApiCall('getLatestComments');
        try {
            const apiResponse = await commentHttpClient.get(
                `/comments/latest?size=${limit}&sort=createdAt,desc`
            );

            if (apiResponse.code !== 200) {
                console.error(apiResponse.message || "Không thể lấy danh sách bình luận mới nhất");
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy danh sách bình luận mới nhất:`, error);
            return null;
        }
    }

    /**
     * Xóa bình luận (chỉ người tạo mới được xóa)
     * @param commentId ID của bình luận
     * @returns true nếu thành công, false nếu thất bại
     */
    async deleteComment(commentId) {
        logApiCall('deleteComment');
        try {
            const apiResponse = await commentHttpClient.delete(`/comments/${commentId}`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể xóa bình luận", { position: "top-right" });
                return false;
            }

            toast.success("Xóa bình luận thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi xóa bình luận ID ${commentId}:`, error);

            // Xử lý lỗi cụ thể
            if (error.response && error.response.data) {
                const errorMessage = error.response.data.message;
                if (errorMessage.includes("not authorized")) {
                    toast.error("Bạn chỉ có thể xóa bình luận của chính mình", { position: "top-right" });
                } else if (errorMessage.includes("not found")) {
                    toast.error("Bình luận không tồn tại", { position: "top-right" });
                } else {
                    toast.error(errorMessage || "Không thể xóa bình luận", { position: "top-right" });
                }
            } else {
                toast.error("Đã xảy ra lỗi khi xóa bình luận", { position: "top-right" });
            }
            return false;
        }
    }

    /**
     * Đếm số bình luận của một manga
     * @param mangaId ID của manga
     * @returns Tổng số bình luận hoặc 0 nếu thất bại
     */
    async countCommentsByMangaId(mangaId) {
        logApiCall('countCommentsByMangaId');
        try {
            const apiResponse = await commentHttpClient.get(`/comments/mangas/${mangaId}/count`);

            if (apiResponse.code !== 200) {
                console.error(`Lỗi đếm bình luận của manga ID ${mangaId}:`, apiResponse.message);
                return 0;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi đếm bình luận của manga ID ${mangaId}:`, error);
            return 0;
        }
    }
}

const commentService = new CommentService();
export default commentService;
