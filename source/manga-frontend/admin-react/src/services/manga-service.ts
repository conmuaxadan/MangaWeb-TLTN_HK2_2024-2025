import { toast } from "react-toastify";
import { mangaHttpClient } from "./http-client";
import { ApiResponse } from "../interfaces/models/ApiResponse";
import {
    MangaResponse,
    ChapterResponse,
    PageResponse,
    MangaSummaryResponse,
    MangaStatisticsResponse,
    AdvancedSearchRequest
} from "../interfaces/models/manga";
import { logApiCall } from "../utils/api-logger";
import { GenreResponse } from "../interfaces/models/genre";

class MangaService {
    /**
     * Lấy danh sách tất cả manga
     * @returns Danh sách manga hoặc null nếu thất bại
     */
    async getAllMangas(): Promise<MangaResponse[] | null> {
        logApiCall('getAllMangas');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<MangaResponse[]>>('/mangas');

            if (apiResponse.code !== 1000) {
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
     * Lấy thông tin chi tiết của một manga
     * @param id ID của manga
     * @returns Thông tin chi tiết manga hoặc null nếu thất bại
     */
    async getMangaById(id: string): Promise<MangaResponse | null> {
        logApiCall('getMangaById');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<MangaResponse>>(`/mangas/${id}`);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lấy thông tin manga", { position: "top-right" });
                return null;
            }

            // Thêm ảnh mặc định nếu manga không có coverUrl
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
     * Lấy danh sách tất cả thể loại
     * @returns Danh sách thể loại hoặc null nếu thất bại
     */
    async getAllGenres(): Promise<GenreResponse[] | null> {
        logApiCall('getAllGenres');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<GenreResponse[]>>('/genres');

            if (apiResponse.code !== 1000) {
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
     * Lấy thông tin chi tiết của một thể loại
     * @param name Tên của thể loại
     * @returns Thông tin chi tiết thể loại hoặc null nếu thất bại
     */
    async getGenreByName(name: string): Promise<GenreResponse | null> {
        logApiCall('getGenreByName');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<GenreResponse>>(`/genres/${name}`);

            if (apiResponse.code !== 1000) {
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
     * Lấy danh sách manga theo thể loại
     * @param genreName Tên thể loại
     * @param page Số trang
     * @param size Số lượng item trên mỗi trang
     * @returns Danh sách manga thuộc thể loại hoặc null nếu thất bại
     */
    async getMangasByGenre(genreName: string, page: number = 0, size: number = 10): Promise<PageResponse<MangaResponse> | null> {
        logApiCall('getMangasByGenre');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<PageResponse<MangaResponse>>>(
                `/mangas/genre/${genreName}?page=${page}&size=${size}`
            );

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lấy danh sách manga theo thể loại", { position: "top-right" });
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
            console.error(`Lỗi lấy danh sách manga theo thể loại ${genreName}:`, error);
            return null;
        }
    }


    /**
     * Lấy thông tin chi tiết của một chapter
     * @param chapterId ID của chapter
     * @returns Thông tin chi tiết chapter hoặc null nếu thất bại
     */
    async getChapterById(chapterId: string): Promise<ChapterResponse | null> {
        logApiCall('getChapterById');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<ChapterResponse>>(`/chapters/${chapterId}`);

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể lấy thông tin chapter", { position: "top-right" });
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin chapter ID ${chapterId}:`, error);
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

            if (apiResponse.code !== 1000) {
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
        logApiCall('advancedSearch');
        try {
            console.log('Advanced search request:', JSON.stringify(searchRequest, null, 2));
            const apiResponse = await mangaHttpClient.post<ApiResponse<PageResponse<MangaResponse>>>(
                `/mangas/search/advanced?page=${page}&size=${size}`,
                searchRequest
            );

            if (apiResponse.code !== 1000) {
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
     * Lấy danh sách manga được đề xuất
     * @param limit Số lượng manga muốn lấy
     * @returns Danh sách manga được đề xuất hoặc null nếu thất bại
     */
    async getRecommendedMangas(limit: number = 10): Promise<MangaSummaryResponse[] | null> {
        logApiCall('getRecommendedMangas');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<MangaSummaryResponse[]>>(`/recommendations?limit=${limit}`);

            if (apiResponse.code !== 1000) {
                console.error("Không thể lấy danh sách manga được đề xuất:", apiResponse.message);
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
            console.error("Lỗi lấy danh sách manga được đề xuất:", error);
            return null;
        }
    }

    /**
     * Lấy danh sách manga mới cập nhật
     * @param limit Số lượng manga muốn lấy
     * @returns Danh sách manga mới cập nhật hoặc null nếu thất bại
     */
    async getLatestUpdatedMangas(limit: number = 10): Promise<MangaSummaryResponse[] | null> {
        logApiCall('getLatestUpdatedMangas');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<MangaSummaryResponse[]>>(`/mangas/latest?limit=${limit}`);

            if (apiResponse.code !== 1000) {
                console.error("Không thể lấy danh sách manga mới cập nhật:", apiResponse.message);
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
            console.error("Lỗi lấy danh sách manga mới cập nhật:", error);
            return null;
        }
    }

    /**
     * Lấy danh sách manga phổ biến
     * @param limit Số lượng manga muốn lấy
     * @returns Danh sách manga phổ biến hoặc null nếu thất bại
     */
    async getPopularMangas(limit: number = 10): Promise<MangaSummaryResponse[] | null> {
        logApiCall('getPopularMangas');
        try {
            const apiResponse = await mangaHttpClient.get<ApiResponse<MangaSummaryResponse[]>>(`/mangas/popular?limit=${limit}`);

            if (apiResponse.code !== 1000) {
                console.error("Không thể lấy danh sách manga phổ biến:", apiResponse.message);
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
            console.error("Lỗi lấy danh sách manga phổ biến:", error);
            return null;
        }
    }

    /**
     * Tăng lượt xem cho chapter
     * @param chapterId ID của chapter
     * @returns true nếu thành công, false nếu thất bại
     */
    async incrementChapterView(chapterId: string): Promise<boolean> {
        logApiCall('incrementChapterView');
        try {
            const apiResponse = await mangaHttpClient.post<ApiResponse<void>>(`/chapters/${chapterId}/views/increment`);

            return apiResponse.code === 1000;
        } catch (error) {
            console.error(`Lỗi tăng lượt xem cho chapter ID ${chapterId}:`, error);
            return false;
        }
    }

    /**
     * Tạo truyện mới
     * @param formData FormData chứa thông tin truyện mới
     * @returns Thông tin truyện đã tạo hoặc null nếu thất bại
     */
    async createManga(formData: FormData): Promise<MangaResponse | null> {
        logApiCall('createManga');
        try {
            const apiResponse = await mangaHttpClient.post<ApiResponse<MangaResponse>>('/mangas', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (apiResponse.code !== 1000) {
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
    async updateManga(id: string, formData: FormData): Promise<MangaResponse | null> {
        logApiCall('updateManga');
        try {
            const apiResponse = await mangaHttpClient.put<ApiResponse<MangaResponse>>(`/mangas/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (apiResponse.code !== 1000) {
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

            if (apiResponse.code !== 1000) {
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

            if (apiResponse.code !== 1000) {
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
    async restoreManga(id: string): Promise<MangaResponse | null> {
        logApiCall('restoreManga');
        try {
            const apiResponse = await mangaHttpClient.post<ApiResponse<MangaResponse>>(`/mangas/${id}/restore`);

            if (apiResponse.code !== 1000) {
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

            if (apiResponse.code !== 1000) {
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

            if (apiResponse.code !== 1000) {
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

            if (apiResponse.code !== 1000) {
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

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể cập nhật trang", { position: "top-right" });
                return null;
            }

            toast.success("Cập nhật trang thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error:any) {
            console.error(`Lỗi cập nhật trang ${pageIndex} của chapter ID ${chapterId}:`, error);

            // Hiển thị thông báo lỗi chi tiết hơn
            let errorMessage = "Đã xảy ra lỗi khi cập nhật trang";
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

            if (apiResponse.code !== 1000) {
                toast.error(apiResponse.message || "Không thể xóa trang", { position: "top-right" });
                return null;
            }

            toast.success("Xóa trang thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error:any) {
            console.error(`Lỗi xóa trang ${pageIndex} của chapter ID ${chapterId}:`, error);

            // Hiển thị thông báo lỗi chi tiết hơn
            let errorMessage = "Đã xảy ra lỗi khi xóa trang";
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
     * Lấy danh sách tất cả chapter
     * @returns Danh sách chapter hoặc null nếu thất bại
     */
    async getAllChapters(): Promise<ChapterResponse[] | null> {
        logApiCall('getAllChapters');
        try {
            console.log('Gọi API: GET /chapters');
            const apiResponse = await mangaHttpClient.get<ApiResponse<ChapterResponse[]>>('/chapters');
            console.log('Kết quả API getAllChapters:', apiResponse);

            if (apiResponse.code !== 1000) {
                console.error("Không thể lấy danh sách chapter:", apiResponse.message);
                return [];
            }

            console.log('Số lượng chapter nhận được:', apiResponse.result ? apiResponse.result.length : 0);
            return apiResponse.result || [];
        } catch (error) {
            console.error("Lỗi lấy danh sách chapter:", error);
            return [];
        }
    }

    /**
     * Lấy danh sách tất cả chapter (phương pháp thay thế)
     * @returns Danh sách chapter hoặc null nếu thất bại
     */
    async getAllChaptersAlternative(): Promise<ChapterResponse[] | null> {
        logApiCall('getAllChaptersAlternative');
        try {
            console.log('Bắt đầu lấy danh sách tất cả manga');
            // Lấy danh sách tất cả manga trước
            const mangasResponse = await this.getAllMangas();
            if (!mangasResponse) {
                console.error("Không thể lấy danh sách manga");
                return [];
            }

            console.log(`Lấy được ${mangasResponse.length} manga, bắt đầu lấy chapter cho từng manga`);

            // Lấy danh sách chapter cho từng manga và gộp lại
            const allChaptersPromises = mangasResponse.map(manga =>
                this.getChaptersByMangaId(manga.id)
            );

            const chaptersResults = await Promise.all(allChaptersPromises);

            // Lọc bỏ các kết quả null và gộp tất cả chapter lại
            // Mỗi kết quả là một mảng (có thể rỗng nếu manga chưa có chapter)
            const allChapters = chaptersResults
                .filter(chapters => chapters !== null)
                .flat() as ChapterResponse[];

            console.log(`Tổng số chapter đã lấy được: ${allChapters.length}`);
            return allChapters;
        } catch (error) {
            console.error("Lỗi lấy danh sách chapter (phương pháp thay thế):", error);
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

            if (apiResponse.code !== 1000) {
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

            if (apiResponse.code !== 1000) {
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

            if (apiResponse.code !== 1000) {
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

            if (apiResponse.code !== 1000) {
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
}

export default new MangaService();
