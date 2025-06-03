import { toast } from "react-toastify";
import { mangaHttpClient } from "./http-client.js";
import { logApiCall } from "../utils/api-logger.js";

class MangaService {
    async getMyMangas(page = 0, size = 10, keyword) {
        logApiCall('getMyMangas');
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', size.toString());
            if (keyword && keyword.trim()) {
                params.append('keyword', keyword.trim());
            }
            const apiResponse = await mangaHttpClient.get(`/mangas/my-mangas?${params.toString()}`);
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách truyện của bạn", { position: "top-right" });
                return null;
            }
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

    async getAllMangas(page = 0, size = 10, keyword, genreName, status, yearOfRelease) {
        logApiCall('getAllMangas');
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', size.toString());
            if (keyword && keyword.trim()) params.append('keyword', keyword.trim());
            if (genreName && genreName.trim()) params.append('genreName', genreName.trim());
            if (status && status.trim()) params.append('status', status.trim());
            if (yearOfRelease) params.append('yearOfRelease', yearOfRelease.toString());
            const apiResponse = await mangaHttpClient.get(`/mangas?${params.toString()}`);
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách manga", { position: "top-right" });
                return null;
            }
            apiResponse.result.content.forEach(manga => {
                if (!manga.coverUrl) manga.coverUrl = '/images/default-manga-cover.jpg';
            });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách manga:", error);
            return null;
        }
    }

    async getAllDeletedMangas(page = 0, size = 10, keyword, genreName, status, yearOfRelease) {
        logApiCall('getAllDeletedMangas');
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', size.toString());
            if (keyword && keyword.trim()) params.append('keyword', keyword.trim());
            if (genreName && genreName.trim()) params.append('genreName', genreName.trim());
            if (status && status.trim()) params.append('status', status.trim());
            if (yearOfRelease) params.append('yearOfRelease', yearOfRelease.toString());
            const apiResponse = await mangaHttpClient.get(`/mangas/management/deleted?${params.toString()}`);
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách manga", { position: "top-right" });
                return null;
            }
            apiResponse.result.content.forEach(manga => {
                if (!manga.coverUrl) manga.coverUrl = '/images/default-manga-cover.jpg';
            });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách manga:", error);
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
                if (!manga.coverUrl) manga.coverUrl = '/images/default-manga-cover.jpg';
            });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi tìm kiếm manga:", error);
            return null;
        }
    }

    async createManga(formData) {
        logApiCall('createManga');
        try {
            const apiResponse = await mangaHttpClient.post('/mangas', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
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

    async updateManga(id, formData) {
        logApiCall('updateManga');
        try {
            const apiResponse = await mangaHttpClient.put(`/mangas/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
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

    async deleteManga(id) {
        logApiCall('deleteManga');
        try {
            const apiResponse = await mangaHttpClient.delete(`/mangas/${id}`);
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

    async getMyDeletedMangas(page = 0, size = 10) {
        logApiCall('getMyDeletedMangas');
        try {
            const apiResponse = await mangaHttpClient.get(`/mangas/my-deleted?page=${page}&size=${size}`);
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

    async restoreMyManga(id) {
        logApiCall('restoreMyManga');
        try {
            const apiResponse = await mangaHttpClient.post(`/mangas/${id}/my-restore`);
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

    async getDeletedMangas(page = 0, size = 10) {
        logApiCall('getDeletedMangas');
        try {
            const apiResponse = await mangaHttpClient.get(`/mangas/deleted?page=${page}&size=${size}`);
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể lấy danh sách truyện đã xóa", { position: "top-right" });
                return null;
            }
            apiResponse.result.content.forEach(manga => {
                if (!manga.coverUrl) manga.coverUrl = '/images/default-manga-cover.jpg';
            });
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy danh sách truyện đã xóa:", error);
            toast.error("Đã xảy ra lỗi khi lấy danh sách truyện đã xóa", { position: "top-right" });
            return null;
        }
    }

    async restoreManga(id) {
        logApiCall('restoreManga');
        try {
            const apiResponse = await mangaHttpClient.post(`/mangas/${id}/restore`);
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

    async createChapter(formData) {
        logApiCall('createChapter');
        try {
            const apiResponse = await mangaHttpClient.post('/chapters', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
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

    async deleteChapter(id) {
        logApiCall('deleteChapter');
        try {
            const apiResponse = await mangaHttpClient.delete(`/chapters/${id}`);
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

    async updateChapter(id, formData) {
        logApiCall('updateChapter');
        try {
            const apiResponse = await mangaHttpClient.put(`/chapters/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (apiResponse.code !== 200) {
                toast.error(apiResponse.message || "Không thể cập nhật chapter", { position: "top-right" });
                return null;
            }
            toast.success("Cập nhật chapter thành công", { position: "top-right" });
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi cập nhật chapter ID ${id}:`, error);
            let errorMessage = "Đã xảy ra lỗi khi cập nhật chapter";
            if (error.response) {
                if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else {
                    errorMessage += ` (${error.response.status}: ${error.response.statusText})`;
                }
            } else if (error.request) {
                errorMessage += " (Không nhận được phản hồi từ server)";
            } else {
                errorMessage += ` (${error.message})`;
            }
            toast.error(errorMessage, { position: "top-right" });
            return null;
        }
    }

    async getMangaStatistics() {
        logApiCall('getMangaStatistics');
        try {
            const apiResponse = await mangaHttpClient.get('/mangas/statistics');
            if (apiResponse.code !== 200) {
                console.error("Không thể lấy thống kê manga:", apiResponse.message);
                return null;
            }
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi lấy thống kê manga:", error);
            return null;
        }
    }

    async quickSearchManga(keyword) {
        logApiCall('quickSearchManga');
        try {
            console.log('Calling quickSearchManga with keyword:', keyword);
            const apiResponse = await mangaHttpClient.get(`/mangas/search/quick?keyword=${encodeURIComponent(keyword)}`);
            console.log('quickSearchManga response:', apiResponse);
            if (apiResponse.code !== 200) {
                console.error("Không thể tìm kiếm nhanh manga:", apiResponse.message);
                return null;
            }
            return apiResponse.result;
        } catch (error) {
            console.error("Lỗi tìm kiếm nhanh manga:", error);
            console.error("Error details:", error.response?.data, error.response?.status);
            return null;
        }
    }

    async getMangaById(id) {
        logApiCall('getMangaById');
        try {
            const apiResponse = await mangaHttpClient.get(`/mangas/${id}`);
            if (apiResponse.code !== 200) {
                console.error(`Không thể lấy thông tin manga ID ${id}:`, apiResponse.message);
                return null;
            }
            return apiResponse.result;
        } catch (error) {
            console.error(`Lỗi lấy thông tin manga ID ${id}:`, error);
            return null;
        }
    }
}

export default new MangaService();
