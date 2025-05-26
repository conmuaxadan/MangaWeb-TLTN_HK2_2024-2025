import { toast } from "react-toastify";
import { mangaHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import {
    MangaResponse,
    ChapterResponse,
    GenreResponse,
    PageResponse,
    MangaSummaryResponse,
    AdvancedSearchRequest
} from "../interfaces/models/manga";
import authService from "./auth-service";
import { logApiCall } from "../utils/api-logger";

class MangaService {
    /**
     * Lấy thông tin chi tiết manga theo ID
     * @param id ID của manga
     * @returns Thông tin chi tiết manga hoặc null nếu thất bại
     */
    async getMangaById(id: string): Promise<MangaResponse | null> {
        logApiCall('getMangaById');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<MangaResponse>>(`/mangas/${id}`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy thông tin manga", { position: "top-right" });
                return null;
            }

            // Nếu không có coverUrl, sử dụng ảnh mặc định
            if (!apiResponse.result.coverUrl) {
                apiResponse.result.coverUrl = '/images/default-manga-cover.jpg';
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin manga ID ${id}:`, error);
            return null;
        }
    }

    /**
     * Lấy danh sách chapter của một manga
     * @param mangaId ID của manga
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
     * Lấy thông tin chi tiết chapter theo ID
     * @param id ID của chapter
     * @returns Thông tin chi tiết chapter hoặc null nếu thất bại
     */
    async getChapterById(id: string): Promise<ChapterResponse | null> {
        logApiCall('getChapterById');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<ChapterResponse>>(`/chapters/${id}`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy thông tin chapter", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin chapter ID ${id}:`, error);
            return null;
        }
    }

    /**
     * Lấy session ID mới
     * @returns Session ID mới hoặc null nếu thất bại
     */
    async getSessionId(): Promise<string | null> {
        logApiCall('getSessionId');
        try {
            const apiResponse = await mangaHttpClient.post<ApiResponse<string>>(`/chapters/sessions`);

            if (apiResponse.code !== 200) {
                console.error(`Lỗi khi lấy session ID:`, apiResponse.message);
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi khi lấy session ID:`, error);
            return null;
        }
    }

    /**
     * Lấy danh sách tất cả thể loại
     * @returns Danh sách thể loại hoặc null nếu thất bại
     */
    async getAllGenres(): Promise<GenreResponse[] | null> {
        logApiCall('getAllGenres');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<GenreResponse[]>>('/genres');

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách thể loại", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách thể loại:", error);
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
            console.error(`Lỗi tìm kiếm manga với từ khóa '${keyword}':`, error);
            return null;
        }
    }

    /**
     * Tìm kiếm nâng cao manga
     * @param searchRequest Các tham số tìm kiếm nâng cao
     * @param page Số trang
     * @param size Số lượng item trên mỗi trang
     * @param sort Sắp xếp theo (ví dụ: "title,asc" hoặc "views,desc")
     * @returns Danh sách manga phù hợp với điều kiện tìm kiếm hoặc null nếu thất bại
     */
    async advancedSearch(
        searchRequest: AdvancedSearchRequest,
        page: number = 0,
        size: number = 10,
        sort: string = 'lastChapterAddedAt,desc'
    ): Promise<PageResponse<MangaResponse> | null> {
        logApiCall('advancedSearch');
        try {
            console.log('Advanced search request:', JSON.stringify(searchRequest, null, 2));
            const apiResponse = await mangaHttpClient.post<ApiResponse<PageResponse<MangaResponse>>>(
                `/mangas/search/advanced?page=${page}&size=${size}&sort=${encodeURIComponent(sort)}`,
                searchRequest
            );

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
            console.error("Lỗi tìm kiếm nâng cao manga:", error);
            return null;
        }
    }

    /**
     * Tìm kiếm manga theo thể loại
     * @param genreName Tên thể loại
     * @param page Số trang
     * @param size Số lượng item trên mỗi trang
     * @returns Danh sách manga thuộc thể loại hoặc null nếu thất bại
     */
    async findByGenre(genreName: string, page: number = 0, size: number = 10): Promise<PageResponse<MangaResponse> | null> {
        logApiCall('findByGenre');
        try {
            const url = `/mangas/genre/${encodeURIComponent(genreName)}?page=${page}&size=${size}`;
            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<MangaResponse>>>(url);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể tìm kiếm manga theo thể loại", { position: "top-right" });
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
            console.error(`Lỗi tìm kiếm manga theo thể loại '${genreName}':`, error);
            return null;
        }
    }

    /**
     * Lấy danh sách tóm tắt manga có phân trang
     * @param page Số trang
     * @param size Số lượng item trên mỗi trang
     * @param sort Sắp xếp (ví dụ: "lastChapterAddedAt,desc")
     * @returns Danh sách tóm tắt manga có phân trang hoặc null nếu thất bại
     */
    async getMangaSummaries(page: number = 0, size: number = 10, sort: string = "lastChapterAddedAt,desc"): Promise<PageResponse<MangaSummaryResponse> | null> {
        logApiCall('getMangaSummaries');
        try {
            let url = `/mangas/summaries?page=${page}&size=${size}`;
            if (sort) {
                url += `&sort=${sort}`;
            }

            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<MangaSummaryResponse>>>(url);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách tóm tắt manga", { position: "top-right" });
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
            console.error("Lỗi lấy danh sách tóm tắt manga:", error);
            return null;
        }
    }

    /**
     * Lấy gợi ý manga dựa trên thể loại từ lịch sử đọc của người dùng
     * @param limit Số lượng manga gợi ý (mặc định là 6)
     * @returns Danh sách manga được gợi ý hoặc null nếu thất bại
     */
    async getPersonalRecommendations(limit: number = 6): Promise<MangaSummaryResponse[] | null> {
        logApiCall('getPersonalRecommendations');
        try {
            // Lấy thông tin người dùng hiện tại từ token
            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                console.log("Không có người dùng đăng nhập, không thể lấy gợi ý cá nhân");
                return null;
            }

            const url = `/recommendations/by-genre?userId=${currentUser.userId}&limit=${limit}`;
            const apiResponse = await mangaHttpClient.get<ApiResponse<MangaSummaryResponse[]>>(url);

            if (apiResponse.code !== 200) {
                console.log(`Lỗi API (${apiResponse.code}): ${apiResponse.message || "Không thể lấy gợi ý manga"}`);
                return null;
            }

            // Nếu kết quả rỗng, trả về null để không hiển thị phần gợi ý
            if (!apiResponse.result || apiResponse.result.length === 0) {
                console.log("Không có gợi ý nào cho người dùng - API trả về danh sách rỗng");
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy gợi ý manga:", error);
            if (error instanceof Error) {
                console.log(`Chi tiết lỗi: ${error.message}`);
            }
            return null;
        }
    }
}

export default new MangaService();
