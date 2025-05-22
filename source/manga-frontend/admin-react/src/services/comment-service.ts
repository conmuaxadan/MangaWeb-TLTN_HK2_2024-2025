import { toast } from "react-toastify";
import { commentHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import { CommentResponse, CommentPageResponse } from "../interfaces/models/comment";
import { logApiCall } from "../utils/api-logger";

class CommentService {
    /**
     * Lấy tất cả bình luận (dành cho admin)
     * @param page Số trang
     * @param size Số lượng bình luận mỗi trang
     * @returns Danh sách bình luận có phân trang hoặc null nếu thất bại
     */
    async getAllComments(page: number = 0, size: number = 20): Promise<CommentPageResponse | null> {
        logApiCall('getAllComments');
        try {
            const apiResponse = await commentHttpClient.get<ApiResponse<CommentPageResponse>>(
                `/comments/admin/all?page=${page}&size=${size}&sort=createdAt,desc`
            );

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể lấy danh sách bình luận");
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy danh sách bình luận:`, error);
            return null;
        }
    }

    /**
     * Tìm kiếm bình luận (dành cho admin)
     * @param keyword Từ khóa tìm kiếm
     * @param page Số trang
     * @param size Số lượng bình luận mỗi trang
     * @returns Danh sách bình luận có phân trang hoặc null nếu thất bại
     */
    async searchComments(keyword: string, page: number = 0, size: number = 20): Promise<CommentPageResponse | null> {
        logApiCall('searchComments');
        try {
            const apiResponse = await commentHttpClient.get<ApiResponse<CommentPageResponse>>(
                `/comments/admin/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}&sort=createdAt,desc`
            );

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể tìm kiếm bình luận");
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi tìm kiếm bình luận:`, error);
            return null;
        }
    }

    /**
     * Xóa bình luận (dành cho admin)
     * @param commentId ID của bình luận
     * @returns true nếu thành công, false nếu thất bại
     */
    async deleteComment(commentId: string): Promise<boolean> {
        logApiCall('deleteComment');
        try {
            const apiResponse = await commentHttpClient.delete<ApiResponse<void>>(`/comments/admin/${commentId}`);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể xóa bình luận", { position: "top-right" });
                return false;
            }

            toast.success("Xóa bình luận thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi xóa bình luận ID ${commentId}:`, error);
            toast.error("Đã xảy ra lỗi khi xóa bình luận", { position: "top-right" });
            return false;
        }
    }

    /**
     * Lấy danh sách bình luận theo mangaId
     * @param mangaId ID của manga
     * @param page Số trang
     * @param size Số lượng bình luận mỗi trang
     * @returns Danh sách bình luận có phân trang hoặc null nếu thất bại
     */
    async getCommentsByMangaId(mangaId: string, page: number = 0, size: number = 20): Promise<CommentPageResponse | null> {
        logApiCall('getCommentsByMangaId');
        try {
            const apiResponse = await commentHttpClient.get<ApiResponse<CommentPageResponse>>(
                `/comments/mangas/${mangaId}?page=${page}&size=${size}&sort=createdAt,desc`
            );

            if (apiResponse.code !== 1000) {
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
     * Lấy danh sách bình luận theo chapterId
     * @param chapterId ID của chapter
     * @param page Số trang
     * @param size Số lượng bình luận mỗi trang
     * @returns Danh sách bình luận có phân trang hoặc null nếu thất bại
     */
    async getCommentsByChapterId(chapterId: string, page: number = 0, size: number = 20): Promise<CommentPageResponse | null> {
        logApiCall('getCommentsByChapterId');
        try {
            const apiResponse = await commentHttpClient.get<ApiResponse<CommentPageResponse>>(
                `/comments/chapters/${chapterId}?page=${page}&size=${size}&sort=createdAt,desc`
            );

            if (apiResponse.code !== 1000) {
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
     * Đếm tổng số bình luận trong hệ thống
     * @returns Tổng số bình luận hoặc 0 nếu thất bại
     */
    async countTotalComments(): Promise<number> {
        logApiCall('countTotalComments');
        try {
            const apiResponse = await commentHttpClient.get<ApiResponse<number>>('/comments/count');

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể đếm tổng số bình luận");
                return 0;
            }

            return apiResponse.result;
        } catch (error) {
            console.error('Lỗi đếm tổng số bình luận:', error);
            return 0;
        }
    }

    /**
     * Đếm số bình luận mới trong ngày hôm nay
     * @returns Số bình luận mới trong ngày hoặc 0 nếu thất bại
     */
    async countTodayComments(): Promise<number> {
        logApiCall('countTodayComments');
        try {
            const apiResponse = await commentHttpClient.get<ApiResponse<number>>('/comments/count/today');

            if (apiResponse.code !== 1000) {
                console.error(apiResponse.message || "Không thể đếm số bình luận mới trong ngày");
                return 0;
            }

            return apiResponse.result;
        } catch (error) {
            console.error('Lỗi đếm số bình luận mới trong ngày:', error);
            return 0;
        }
    }
}

// Tạo một instance của CommentService
const commentService = new CommentService();
export default commentService;
