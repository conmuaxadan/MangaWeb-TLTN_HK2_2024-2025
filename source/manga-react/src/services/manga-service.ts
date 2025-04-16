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

class MangaService {
    /**
     * Lấy danh sách tất cả manga
     * @returns Danh sách manga hoặc null nếu thất bại
     */
    async getAllMangas(): Promise<MangaResponse[] | null> {
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<MangaResponse[]>>('/mangas');

            if (apiResponse.code !== 2000) {
                toast.error(apiResponse.message || "Không thể lấy danh sách manga", { position: "top-right" });
                return null;
            }

            // Thêm ảnh mặc định cho các manga không có coverUrl
            apiResponse.result.forEach(manga => {
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
     * Lấy danh sách manga có phân trang
     * @param page Số trang
     * @param size Số lượng item trên mỗi trang
     * @param sort Sắp xếp (ví dụ: "title,asc")
     * @returns Danh sách manga có phân trang hoặc null nếu thất bại
     */
    async getPaginatedMangas(page: number = 0, size: number = 10, sort?: string): Promise<PageResponse<MangaResponse> | null> {
        try {
            let url = `/mangas/paginated?page=${page}&size=${size}`;
            if (sort) {
                url += `&sort=${sort}`;
            }

            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<MangaResponse>>>(url);

            if (apiResponse.code !== 2000) {
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
            console.error("Lỗi lấy danh sách manga phân trang:", error);
            return null;
        }
    }

    /**
     * Lấy thông tin chi tiết manga theo ID
     * @param id ID của manga
     * @returns Thông tin chi tiết manga hoặc null nếu thất bại
     */
    async getMangaById(id: string): Promise<MangaResponse | null> {
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<MangaResponse>>(`/mangas/${id}`);

            if (apiResponse.code !== 2000) {
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
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<ChapterResponse[]>>(`/chapters/manga/${mangaId}`);

            if (apiResponse.code !== 2000) {
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
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<ChapterResponse>>(`/chapters/${id}`);

            if (apiResponse.code !== 2000) {
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
     * Tăng lượt xem của chapter
     * @param id ID của chapter
     * @returns Thông tin chapter sau khi cập nhật lượt xem hoặc null nếu thất bại
     */
    async incrementChapterViews(id: string): Promise<ChapterResponse | null> {
        try {
            const apiResponse = await mangaHttpClient.post<ApiResponse<ChapterResponse>>(`/chapters/${id}/view`);

            if (apiResponse.code !== 2000) {
                // Không hiển thị thông báo lỗi vì đây là tính năng ngầm
                console.error(`Lỗi khi tăng lượt xem chapter ID ${id}:`, apiResponse.message);
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi khi tăng lượt xem chapter ID ${id}:`, error);
            return null;
        }
    }

    /**
     * Lấy danh sách tất cả thể loại
     * @returns Danh sách thể loại hoặc null nếu thất bại
     */
    async getAllGenres(): Promise<GenreResponse[] | null> {
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<GenreResponse[]>>('/genres');

            if (apiResponse.code !== 2000) {
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
     * Lấy thông tin thể loại theo tên
     * @param name Tên thể loại
     * @returns Thông tin thể loại hoặc null nếu thất bại
     */
    async getGenreByName(name: string): Promise<GenreResponse | null> {
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<GenreResponse>>(`/genres/${name}`);

            if (apiResponse.code !== 2000) {
                toast.error(apiResponse.message || "Không thể lấy thông tin thể loại", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin thể loại ${name}:`, error);
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
        try {
            const url = `/mangas/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`;
            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<MangaResponse>>>(url);

            if (apiResponse.code !== 2000) {
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
     * @returns Danh sách manga phù hợp với điều kiện tìm kiếm hoặc null nếu thất bại
     */
    async advancedSearch(
        searchRequest: AdvancedSearchRequest,
        page: number = 0,
        size: number = 10
    ): Promise<PageResponse<MangaResponse> | null> {
        try {
            const apiResponse = await mangaHttpClient.post<ApiResponse<PageResponse<MangaResponse>>>(
                `/mangas/advanced-search?page=${page}&size=${size}`,
                searchRequest
            );

            if (apiResponse.code !== 2000) {
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
     * Lấy danh sách tóm tắt manga có phân trang
     * @param page Số trang
     * @param size Số lượng item trên mỗi trang
     * @param sort Sắp xếp (ví dụ: "lastChapterAddedAt,desc")
     * @returns Danh sách tóm tắt manga có phân trang hoặc null nếu thất bại
     */
    async getMangaSummaries(page: number = 0, size: number = 10, sort: string = "lastChapterAddedAt,desc"): Promise<PageResponse<MangaSummaryResponse> | null> {
        try {
            let url = `/mangas/summaries?page=${page}&size=${size}`;
            if (sort) {
                url += `&sort=${sort}`;
            }

            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<MangaSummaryResponse>>>(url);

            if (apiResponse.code !== 2000) {
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
}

export default new MangaService();
