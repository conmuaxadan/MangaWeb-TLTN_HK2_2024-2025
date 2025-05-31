import { toast } from "react-toastify";
import { mangaHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import {
    MangaResponse,
    ChapterResponse,
    PageResponse,
    MangaStatisticsResponse, MangaManagementResponse,
    MangaQuickSearchResponse,
} from "../interfaces/models/manga";
import { logApiCall } from "../utils/api-logger";

class MangaService {
    /**
     * Lấy danh sách manga của translator hiện tại
     * @param page Số trang (mặc định là 0)
     * @param size Số lượng item trên mỗi trang (mặc định là 10)
     * @param keyword Từ khóa tìm kiếm (optional)
     * @returns Danh sách manga của translator hoặc null nếu thất bại
     */
    async getMyMangas(
        page: number = 0,
        size: number = 10,
        keyword?: string
    ): Promise<PageResponse<MangaManagementResponse> | null> {
        logApiCall('getMyMangas');
        try {
            // Xây dựng URL với các tham số filter
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', size.toString());
            if (keyword && keyword.trim()) {
                params.append('keyword', keyword.trim());
            }

            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<MangaManagementResponse>>>(`/mangas/my-mangas?${params.toString()}`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách truyện của bạn", { position: "top-right" });
                return null;
            }

            // Thêm ảnh mặc định cho các manga không có coverUrl
            apiResponse.result.content.forEach(manga => {
                if (!manga.coverUrl) {
                    manga.coverUrl = '/images/default-manga-cover.jpg';
                }
            });

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách truyện của tôi:", error);
            return null;
        }
    }

    /**
     * Lấy danh sách tất cả manga có phân trang
     * @param page Số trang (mặc định là 0)
     * @param size Số lượng item trên mỗi trang (mặc định là 10)
     * @returns Danh sách manga có phân trang hoặc null nếu thất bại
     */
    async getAllMangas(
        page: number = 0,
        size: number = 10,
        keyword?: string,
        genreName?: string,
        status?: string,
        yearOfRelease?: number
    ): Promise<PageResponse<MangaManagementResponse> | null> {
        logApiCall('getAllMangas');
        try {
            // Xây dựng URL với các tham số filter
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', size.toString());
            if (keyword && keyword.trim()) {
                params.append('keyword', keyword.trim());
            }
            if (genreName && genreName.trim()) {
                params.append('genreName', genreName.trim());
            }
            if (status && status.trim()) {
                params.append('status', status.trim());
            }
            if (yearOfRelease) {
                params.append('yearOfRelease', yearOfRelease.toString());
            }
            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<MangaManagementResponse>>>(`/mangas?${params.toString()}`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách manga", { position: "top-right" });
                return null;
            }
            // Thêm ảnh mặc định cho các manga không có coverUrl
            apiResponse.result.content.forEach(manga => {
                if (!manga.coverUrl) {
                    manga.coverUrl = '/images/default-manga-cover.jpg';
                }
            });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách manga:", error);
            return null;
        }
    }

    async getAllDeletedMangas(
        page: number = 0,
        size: number = 10,
        keyword?: string,
        genreName?: string,
        status?: string,
        yearOfRelease?: number
    ): Promise<PageResponse<MangaManagementResponse> | null> {
        logApiCall('getAllDeletedMangas');
        try {
            // Xây dựng URL với các tham số filter
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', size.toString());

            if (keyword && keyword.trim()) {
                params.append('keyword', keyword.trim());
            }
            if (genreName && genreName.trim()) {
                params.append('genreName', genreName.trim());
            }
            if (status && status.trim()) {
                params.append('status', status.trim());
            }
            if (yearOfRelease) {
                params.append('yearOfRelease', yearOfRelease.toString());
            }

            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<MangaManagementResponse>>>(`/mangas/management/deleted?${params.toString()}`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách manga", { position: "top-right" });
                return null;
            }

            // Thêm ảnh mặc định cho các manga không có coverUrl
            apiResponse.result.content.forEach(manga => {
                if (!manga.coverUrl) {
                    manga.coverUrl = '/images/default-manga-cover.jpg';
                }
            });

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách manga:", error);
            return null;
        }
    }

    /**
     * Tìm kiếm manga theo từ khóa
     * @param keyword Từ khóa tìm kiếm
     * @param page Số trang
     * @param size Số lượng item trên mỗi trang
     * @returns Danh sách manga phù hợp với từ khóa tìm kiếm hoặc null nếu thất bại
     */
    async searchManga(keyword: string, page: number = 0, size: number = 10): Promise<PageResponse<MangaResponse> | null> {
        logApiCall('searchManga');
        try {
            const url = `/mangas/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`;
            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<MangaResponse>>>(url);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể tìm kiếm manga", { position: "top-right" });
                return null;
            }

            // Thêm ảnh mặc định cho các manga không có coverUrl
            apiResponse.result.content.forEach(manga => {
                if (!manga.coverUrl) {
                    manga.coverUrl = '/images/default-manga-cover.jpg';
                }
            });

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi tìm kiếm manga:", error);
            return null;
        }
    }

    /**
     * Tạo truyện mới
     * @param formData FormData chứa thông tin truyện mới
     * @returns Thông tin truyện đã tạo hoặc null nếu thất bại
     */
    async createManga(formData: FormData): Promise<MangaManagementResponse | null> {
        logApiCall('createManga');
        try {
            const apiResponse = await mangaHttpClient.post<ApiResponse<MangaManagementResponse>>('/mangas', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (apiResponse.code !== 201) {
                toast.error(apiResponse.message || "Không thể tạo truyện mới", { position: "top-right" });
                return null;
            }

            toast.success("Tạo truyện mới thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi tạo truyện mới:", error);
            toast.error("Đã xảy ra lỗi khi tạo truyện mới", { position: "top-right" });
            return null;
        }
    }

    /**
     * Cập nhật truyện
     * @param id ID của truyện cần cập nhật
     * @param formData FormData chứa thông tin cập nhật
     * @returns Thông tin truyện đã cập nhật hoặc null nếu thất bại
     */
    async updateManga(id: string, formData: FormData): Promise<MangaManagementResponse | null> {
        logApiCall('updateManga');
        try {
            const apiResponse = await mangaHttpClient.put<ApiResponse<MangaManagementResponse>>(`/mangas/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể cập nhật truyện", { position: "top-right" });
                return null;
            }

            toast.success("Cập nhật truyện thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi cập nhật truyện ID ${id}:`, error);
            toast.error("Đã xảy ra lỗi khi cập nhật truyện", { position: "top-right" });
            return null;
        }
    }

    /**
     * Xóa mềm truyện
     * @param id ID của truyện cần xóa
     * @returns true nếu thành công, false nếu thất bại
     */
    async deleteManga(id: string): Promise<boolean> {
        logApiCall('deleteManga');
        try {
            const apiResponse = await mangaHttpClient.delete<ApiResponse<void>>(`/mangas/${id}`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể xóa truyện", { position: "top-right" });
                return false;
            }

            toast.success("Xóa truyện thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi xóa truyện ID ${id}:`, error);
            toast.error("Đã xảy ra lỗi khi xóa truyện", { position: "top-right" });
            return false;
        }
    }

    /**
     * Lấy danh sách truyện đã xóa của translator
     * @param page Số trang
     * @param size Số lượng item trên mỗi trang
     * @returns Danh sách truyện đã bị xóa hoặc null nếu thất bại
     */
    async getMyDeletedMangas(page: number = 0, size: number = 10): Promise<PageResponse<MangaManagementResponse> | null> {
        logApiCall('getMyDeletedMangas');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<MangaManagementResponse>>>(
                `/mangas/my-deleted?page=${page}&size=${size}`
            );

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách truyện đã xóa", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error('Lỗi lấy danh sách truyện đã xóa:', error);
            toast.error("Đã xảy ra lỗi khi lấy danh sách truyện đã xóa", { position: "top-right" });
            return null;
        }
    }

    /**
     * Khôi phục truyện của translator
     * @param id ID của truyện cần khôi phục
     * @returns true nếu thành công, false nếu thất bại
     */
    async restoreMyManga(id: string): Promise<boolean> {
        logApiCall('restoreMyManga');
        try {
            const apiResponse = await mangaHttpClient.post<ApiResponse<MangaResponse>>(`/mangas/${id}/my-restore`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể khôi phục truyện", { position: "top-right" });
                return false;
            }

            toast.success("Khôi phục truyện thành công", { position: "top-right" });
            return true;
        } catch (error) {
            console.error(`Lỗi khôi phục truyện ID ${id}:`, error);
            toast.error("Đã xảy ra lỗi khi khôi phục truyện", { position: "top-right" });
            return false;
        }
    }

    /**
     * Lấy danh sách truyện đã bị xóa có phân trang
     * @param page Số trang
     * @param size Số lượng item trên mỗi trang
     * @returns Danh sách truyện đã bị xóa hoặc null nếu thất bại
     */
    async getDeletedMangas(page: number = 0, size: number = 10): Promise<PageResponse<MangaResponse> | null> {
        logApiCall('getDeletedMangas');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<MangaResponse>>>(
                `/mangas/deleted?page=${page}&size=${size}`
            );

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách truyện đã xóa", { position: "top-right" });
                return null;
            }

            // Thêm ảnh mặc định cho các manga không có coverUrl
            apiResponse.result.content.forEach(manga => {
                if (!manga.coverUrl) {
                    manga.coverUrl = '/images/default-manga-cover.jpg';
                }
            });

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách truyện đã xóa:", error);
            toast.error("Đã xảy ra lỗi khi lấy danh sách truyện đã xóa", { position: "top-right" });
            return null;
        }
    }

    /**
     * Khôi phục truyện đã xóa
     * @param id ID của truyện cần khôi phục
     * @returns Thông tin truyện đã khôi phục hoặc null nếu thất bại
     */
    async restoreManga(id: string): Promise<MangaManagementResponse | null> {
        logApiCall('restoreManga');
        try {
            const apiResponse = await mangaHttpClient.post<ApiResponse<MangaManagementResponse>>(`/mangas/${id}/restore`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể khôi phục truyện", { position: "top-right" });
                return null;
            }

            toast.success("Khôi phục truyện thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi khôi phục truyện ID ${id}:`, error);
            toast.error("Đã xảy ra lỗi khi khôi phục truyện", { position: "top-right" });
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
        } catch (error:any) {
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
     * Cập nhật một trang cụ thể trong chapter
     * @param chapterId ID của chapter
     * @param pageIndex Vị trí của trang cần cập nhật
     * @param pageFile File ảnh mới
     * @returns Thông tin chapter đã cập nhật hoặc null nếu thất bại
     */
    async updateChapterPage(chapterId: string, pageIndex: number, pageFile: File): Promise<ChapterResponse | null> {
        logApiCall('updateChapterPage');
        try {
            // Tạo FormData để gửi file
            const formData = new FormData();
            formData.append('page', pageFile);

            const apiResponse = await mangaHttpClient.put<ApiResponse<ChapterResponse>>(
                `/chapters/${chapterId}/pages/${pageIndex}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể cập nhật trang", { position: "top-right" });
                return null;
            }

            toast.success("Cập nhật trang thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error:any) {
            console.error(`Lỗi cập nhật trang ${pageIndex} của chapter ID ${chapterId}:`, error);
            toast.error(error, { position: "top-right" });
            return null;
        }
    }

    /**
     * Xóa một trang cụ thể trong chapter
     * @param chapterId ID của chapter
     * @param pageIndex Vị trí của trang cần xóa
     * @returns Thông tin chapter đã cập nhật hoặc null nếu thất bại
     */
    async deleteChapterPage(chapterId: string, pageIndex: number): Promise<ChapterResponse | null> {
        logApiCall('deleteChapterPage');
        try {
            const apiResponse = await mangaHttpClient.delete<ApiResponse<ChapterResponse>>(
                `/chapters/${chapterId}/pages/${pageIndex}`
            );

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể xóa trang", { position: "top-right" });
                return null;
            }

            toast.success("Xóa trang thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error:any) {
            console.error(`Lỗi xóa trang ${pageIndex} của chapter ID ${chapterId}:`, error);
            toast.error("Đã xảy ra lỗi khi xóa trang", { position: "top-right" });
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
                console.error(`Không thể lấy danh sách chapter của truyện ${mangaId}:`, apiResponse.message);
                return [];
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy danh sách chapter của truyện ${mangaId}:`, error);
            // Trả về mảng rỗng thay vì null để tránh lỗi khi manga chưa có chapter
            return [];
        }
    }

    /**
     * Lấy số chapter cao nhất của một truyện
     * @param mangaId ID của truyện
     * @returns Số chapter cao nhất hoặc 0 nếu thất bại
     */
    async getHighestChapterNumber(mangaId: string): Promise<number> {
        logApiCall('getHighestChapterNumber');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<number>>(`/mangas/${mangaId}/highest-chapter-number`);

            if (apiResponse.code !== 200) {
                console.error(`Không thể lấy số chapter cao nhất của truyện ${mangaId}:`, apiResponse.message);
                return 0;
            }

            console.log(`Số chapter cao nhất của truyện ${mangaId}:`, apiResponse.result, typeof apiResponse.result);
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy số chapter cao nhất của truyện ${mangaId}:`, error);
            return 0;
        }
    }

    /**
     * Đếm tổng số truyện trong hệ thống
     * @param includeDeleted Có bao gồm truyện đã xóa hay không (mặc định là false)
     * @returns Tổng số truyện hoặc 0 nếu thất bại
     */
    async countMangas(includeDeleted: boolean = false): Promise<number> {
        logApiCall('countMangas');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<number>>(`/mangas/count?includeDeleted=${includeDeleted}`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể đếm tổng số truyện", { position: "top-right" });
                return 0;
            }

            console.log(`Tổng số truyện (includeDeleted=${includeDeleted}):`, apiResponse.result);
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi đếm tổng số truyện:`, error);
            return 0;
        }
    }

    /**
     * Lấy thống kê tổng hợp về truyện
     * @returns Thống kê tổng hợp về truyện hoặc null nếu thất bại
     */
    async getMangaStatistics(): Promise<MangaStatisticsResponse | null> {
        logApiCall('getMangaStatistics');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<MangaStatisticsResponse>>('/mangas/statistics');

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy thống kê truyện", { position: "top-right" });
                return null;
            }

            console.log(`Thống kê truyện:`, apiResponse.result);
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thống kê truyện:`, error);
            return null;
        }
    }

    /**
     * Tìm kiếm nhanh manga cho việc thêm chapter
     * @param keyword Từ khóa tìm kiếm (tên truyện)
     * @param limit Giới hạn số lượng kết quả trả về (mặc định: 10)
     * @returns Danh sách truyện phù hợp với từ khóa hoặc mảng rỗng nếu thất bại
     */
    async quickSearchManga(keyword: string, limit: number = 10): Promise<MangaQuickSearchResponse[]> {
        logApiCall('quickSearchManga');
        try {
            const url = `/mangas/search/quick?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
            const apiResponse = await mangaHttpClient.get<ApiResponse<MangaQuickSearchResponse[]>>(url);

            if (apiResponse.code !== 200) {
                console.error("Không thể tìm kiếm nhanh manga:", apiResponse.message);
                return [];
            }

            // Thêm ảnh mặc định cho các manga không có coverUrl
            apiResponse.result.forEach(manga => {
                if (!manga.coverUrl) {
                    manga.coverUrl = '/images/default-manga-cover.jpg';
                }
            });

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi tìm kiếm nhanh manga:", error);
            return [];
        }
    }
}

export default new MangaService();
