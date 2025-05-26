import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, DEFAULT_HEADERS, TIMEOUT, TOKEN_STORAGE, isTokenExpired } from '../configurations/api-config';
import { toast } from 'react-toastify';
import authService from './auth-service';

class HttpClient {
    private instance: AxiosInstance;

    constructor(baseURL: string) {
        this.instance = axios.create({
            baseURL,
            timeout: TIMEOUT,
            headers: DEFAULT_HEADERS,
        });

        // Request interceptor
        this.instance.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                // Kiểm tra xem token có hết hạn không
                const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);

                // Thêm auth header nếu token tồn tại
                if (token) {
                    if (config.headers) {
                        config.headers['Authorization'] = `Bearer ${token}`;
                    }
                }

                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.instance.interceptors.response.use(
            (response: AxiosResponse) => {
                return response;
            },
            async (error) => {
                // Handle errors
                if (error.response) {
                    // Server responded with an error status
                    const { status, data } = error.response;

                    switch (status) {
                        case 401:
                            // Unauthorized - thử refresh token trước khi đăng xuất
                            {
                            // Kiểm tra xem endpoint có yêu cầu xác thực không
                            // Nếu là endpoint công khai, không chuyển hướng đến trang đăng nhập
                            const url = error.config?.url || '';
                            // Danh sách các endpoint công khai không yêu cầu chuyển hướng đến trang login
                            const isPublicEndpoint =
                                url.includes('anonymousReadingHistories') ||
                                url.includes('reading-histories') ||
                                url.includes('mangas') ||
                                url.includes('chapters') ||
                                url.includes('genres') ||
                                url.includes('comments/latest') ||
                                url.includes('roles') ||
                                url.includes('permissions');

                            if (isPublicEndpoint) {
                                console.log('Không chuyển hướng đến trang đăng nhập cho endpoint công khai: ' + url);
                                break;
                            }

                            // Kiểm tra xem token có hết hạn không
                            const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
                            const refreshToken = localStorage.getItem(TOKEN_STORAGE.REFRESH_TOKEN);
                            const tokenExpired = isTokenExpired();

                            // Nếu token hết hạn và có refresh token, thử làm mới token
                            if (token && tokenExpired && refreshToken) {
                                console.log('Token hết hạn, thử làm mới token');
                                try {
                                    const refreshResult = await authService.refreshToken();
                                    if (refreshResult) {
                                        console.log('Làm mới token thành công, thử lại request');
                                        // Nếu làm mới thành công và có config gốc, thử lại request
                                        if (error.config) {
                                            // Cập nhật token trong header
                                            error.config.headers['Authorization'] = `Bearer ${refreshResult.token}`;
                                            // Thử lại request
                                            return this.instance(error.config);
                                        }
                                    } else {
                                        // Nếu làm mới thất bại, chuyển hướng đến trang đăng nhập
                                        console.log('Làm mới token thất bại, chuyển hướng đến trang đăng nhập');
                                        localStorage.removeItem(TOKEN_STORAGE.ACCESS_TOKEN);
                                        localStorage.removeItem(TOKEN_STORAGE.REFRESH_TOKEN);
                                        localStorage.removeItem(TOKEN_STORAGE.TOKEN_EXPIRY);

                                        if (!window.location.pathname.includes('/login')) {
                                            window.location.href = '/login';
                                            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                                        }
                                    }
                                } catch (refreshError) {
                                    console.error('Lỗi khi làm mới token:', refreshError);
                                    // Xóa token và chuyển hướng đến trang đăng nhập
                                    localStorage.removeItem(TOKEN_STORAGE.ACCESS_TOKEN);
                                    localStorage.removeItem(TOKEN_STORAGE.REFRESH_TOKEN);
                                    localStorage.removeItem(TOKEN_STORAGE.TOKEN_EXPIRY);

                                    if (!window.location.pathname.includes('/login')) {
                                        window.location.href = '/login';
                                        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                                    }
                                }
                            } else {
                                // Không có refresh token hoặc token chưa hết hạn, đăng xuất luôn
                                localStorage.removeItem(TOKEN_STORAGE.ACCESS_TOKEN);
                                localStorage.removeItem(TOKEN_STORAGE.REFRESH_TOKEN);
                                localStorage.removeItem(TOKEN_STORAGE.TOKEN_EXPIRY);

                                if (!window.location.pathname.includes('/login')) {
                                    window.location.href = '/login';
                                    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                                }
                            }
                            break; }
                        case 403:
                            // Forbidden
                            toast.error('Bạn không có quyền thực hiện hành động này.');
                            break;
                        case 404:
                            // Not found
                            toast.error('Không tìm thấy tài nguyên yêu cầu.');
                            break;
                        case 500:
                            // Server error
                            toast.error('Đã xảy ra lỗi từ máy chủ. Vui lòng thử lại sau.');
                            break;
                        default:
                            // Other errors
                            {
                                // Kiểm tra xem endpoint có phải là /genres không
                                const url = error.config?.url || '';
                                const isGenresEndpoint = url.includes('/genres');

                                // Chỉ hiển thị toast error nếu không phải là endpoint /genres
                                // Vì các endpoint /genres đã được xử lý trong genre-service.ts
                                if (!isGenresEndpoint) {
                                    const message = data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
                                    toast.error(message);
                                }
                            }
                    }
                } else if (error.request) {
                    // Request was made but no response received
                    toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
                } else {
                    // Error in setting up the request
                    toast.error('Đã xảy ra lỗi. Vui lòng thử lại.');
                }

                return Promise.reject(error);
            }
        );
    }

    // GET request
    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        console.log(`HttpClient: Gọi GET ${url}`);
        try {
            const response = await this.instance.get<T>(url, config);
            console.log(`HttpClient: Kết quả GET ${url}:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`HttpClient: Lỗi GET ${url}:`, error);
            throw error;
        }
    }

    // POST request
    public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        console.log(`HttpClient: Gọi POST ${url} với dữ liệu:`, data);
        try {
            const response = await this.instance.post<T>(url, data, config);
            console.log(`HttpClient: Kết quả POST ${url}:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`HttpClient: Lỗi POST ${url}:`, error);
            throw error;
        }
    }

    // PUT request
    public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        console.log(`HttpClient: Gọi PUT ${url} với dữ liệu:`, data);
        try {
            const response = await this.instance.put<T>(url, data, config);
            console.log(`HttpClient: Kết quả PUT ${url}:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`HttpClient: Lỗi PUT ${url}:`, error);
            throw error;
        }
    }

    // DELETE request
    public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        console.log(`HttpClient: Gọi DELETE ${url}`);
        try {
            const response = await this.instance.delete<T>(url, config);
            console.log(`HttpClient: Kết quả DELETE ${url}:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`HttpClient: Lỗi DELETE ${url}:`, error);
            throw error;
        }
    }

    // PATCH request
    public async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        console.log(`HttpClient: Gọi PATCH ${url} với dữ liệu:`, data);
        try {
            const response = await this.instance.patch<T>(url, data, config);
            console.log(`HttpClient: Kết quả PATCH ${url}:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`HttpClient: Lỗi PATCH ${url}:`, error);
            throw error;
        }
    }
}

// Create instances for each service
export const identityHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.IDENTITY_SERVICE}`);
export const mangaHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.MANGA_SERVICE}`);
export const historyHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.HISTORY_SERVICE}`);
export const commentHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.COMMENT_SERVICE}`);
export const favoriteHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.FAVORITE_SERVICE}`);
export const uploadHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.UPLOAD_SERVICE}`);

export default HttpClient;
