import { toast } from "react-toastify";
import { mangaHttpClient } from "./http-client.js";
import authService from "./auth-service.js";
import { logApiCall } from "../utils/api-logger.js";

class MangaService {
    async getMangaById(id) {
        logApiCall('getMangaById');
        try {
            const apiResponse = await mangaHttpClient.get(`/mangas/${id}`);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy thông tin manga", { position: "top-right" });
                return null;
            }

            if (!apiResponse.result.coverUrl) {
                apiResponse.result.coverUrl = '/images/default-manga-cover.jpg';
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin manga ID ${id}:`, error);
            return null;
        }
    }

    async getChaptersByMangaId(mangaId) {
        logApiCall('getChaptersByMangaId');
        try {
            const apiResponse = await mangaHttpClient.get(`/chapters/manga/${mangaId}`);

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

    async getChapterById(id) {
        logApiCall('getChapterById');
        try {
            const apiResponse = await mangaHttpClient.get(`/chapters/${id}`);

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

    async getAllGenres() {
        logApiCall('getAllGenres');
        try {
            const apiResponse = await mangaHttpClient.get('/genres');

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

    async getGenreByName(name) {
        logApiCall('getGenreByName');
        try {
            const apiResponse = await mangaHttpClient.get(`/genres/name/${encodeURIComponent(name)}`);

            if (apiResponse.code !== 200) {
                console.error("Không thể lấy thông tin thể loại:", apiResponse.message);
                return null;
            }

            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin thể loại '${name}':`, error);
            return null;
        }
    }

    async searchManga(keyword, page = 0, size = 10) {
        logApiCall('searchManga');
        try {
            const url = `/mangas/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`;
            const apiResponse = await mangaHttpClient.get(url);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể tìm kiếm manga", { position: "top-right" });
                return null;
            }

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

    async advancedSearch(searchRequest, page = 0, size = 10, sort = 'lastChapterAddedAt,desc') {
        logApiCall('advancedSearch');
        try {
            const apiResponse = await mangaHttpClient.post(
                `/mangas/search/advanced?page=${page}&size=${size}&sort=${encodeURIComponent(sort)}`,
                searchRequest
            );

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể tìm kiếm manga", { position: "top-right" });
                return null;
            }

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

    async findByGenre(genreName, page = 0, size = 10) {
        logApiCall('findByGenre');
        try {
            const url = `/mangas/genre/${encodeURIComponent(genreName)}?page=${page}&size=${size}`;
            const apiResponse = await mangaHttpClient.get(url);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể tìm kiếm manga theo thể loại", { position: "top-right" });
                return null;
            }

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

    async getMangaSummaries(page = 0, size = 10, sort) {
        logApiCall('getMangaSummaries');
        try {
            let url = `/mangas/summaries?page=${page}&size=${size}`;
            if (sort) {
                url += `&sort=${sort}`;
            }

            const apiResponse = await mangaHttpClient.get(url);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách tóm tắt manga", { position: "top-right" });
                return null;
            }

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

    async getLatestUpdates(page = 0, size = 10) {
        logApiCall('getLatestUpdates');
        try {
            // Thêm các tham số đầy đủ theo chuẩn Spring Pageable
            const url = `/mangas/latest-updates?page=${page}&size=${size}&sort=lastChapterAddedAt,desc`;
            const apiResponse = await mangaHttpClient.get(url);

            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách truyện mới cập nhật", { position: "top-right" });
                return null;
            }

            apiResponse.result.content.forEach(manga => {
                if (!manga.coverUrl) {
                    manga.coverUrl = '/images/default-manga-cover.jpg';
                }
            });

            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách truyện mới cập nhật:", error);
            return null;
        }
    }

    async getPersonalRecommendations(limit = 6) {
        logApiCall('getPersonalRecommendations');
        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                console.log("Không có người dùng đăng nhập, không thể lấy gợi ý cá nhân");
                return null;
            }

            const url = `/recommendations/by-genre?userId=${currentUser.userId}&limit=${limit}`;
            const apiResponse = await mangaHttpClient.get(url);

            if (apiResponse.code !== 200) {
                console.log(`Lỗi API (${apiResponse.code}): ${apiResponse.message || "Không thể lấy gợi ý manga"}`);
                return null;
            }

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
