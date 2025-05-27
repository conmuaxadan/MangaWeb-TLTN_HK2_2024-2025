import axios from 'axios';
import { API_CONFIG, DEFAULT_HEADERS, TIMEOUT, TOKEN_STORAGE, getAuthHeader, isTokenExpired } from '../configurations/api-config.js';
import { toast } from 'react-toastify';
import authService from './auth-service.js';

class HttpClient {
    constructor(baseURL) {
        this.instance = axios.create({
            baseURL,
            timeout: TIMEOUT,
            headers: DEFAULT_HEADERS,
        });

        // Request interceptor
        this.instance.interceptors.request.use(
            async (config) => {
                // Kiểm tra xem token có hết hạn không
                const token = localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
                const refreshToken = localStorage.getItem(TOKEN_STORAGE.REFRESH_TOKEN);

                // Nếu có token và token đã hết hạn và có refresh token
                if (token && isTokenExpired() && refreshToken) {
                    // Thử làm mới token
                    const refreshResult = await authService.refreshToken();

                    if (refreshResult) {
                        // Nếu làm mới thành công, sử dụng token mới
                        if (config.headers) {
                            config.headers['Authorization'] = `Bearer ${refreshResult.token}`;
                        }
                    } else {
                        // Kiểm tra xem endpoint có yêu cầu xác thực không
                        const url = config.url || '';
                        // Danh sách các endpoint công khai không yêu cầu chuyển hướng đến trang login
                        const isPublicEndpoint =
                            url.includes('anonymous-reading-histories') ||
                            url.includes('reading-histories') ||
                            url.includes('mangas') ||
                            url.includes('chapters') ||
                            url.includes('genres') ||
                            url.includes('comments/latest') ||
                            url.includes('auth/forgot-password') ||
                            url.includes('auth/reset-password');

                        if (!isPublicEndpoint) {
                            // Nếu làm mới thất bại và không phải endpoint ẩn danh, xóa token và chuyển hướng đến trang đăng nhập
                            localStorage.removeItem(TOKEN_STORAGE.ACCESS_TOKEN);
                            localStorage.removeItem(TOKEN_STORAGE.REFRESH_TOKEN);
                            localStorage.removeItem(TOKEN_STORAGE.TOKEN_EXPIRY);

                            // Chỉ chuyển hướng nếu đường dẫn hiện tại không phải là trang đăng nhập
                            if (!window.location.pathname.includes('/login')) {
                                window.location.href = '/login';
                            }
                        } else {
                            console.log('Không chuyển hướng đến trang đăng nhập cho endpoint công khai: ' + url);
                        }
                    }
                } else {
                    // Thêm auth header nếu token tồn tại và chưa hết hạn
                    const authHeaders = getAuthHeader();
                    if (authHeaders['Authorization']) {
                        if (config.headers) {
                            config.headers['Authorization'] = authHeaders['Authorization'];
                        }
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
            (response) => {
                return response;
            },
            (error) => {
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
                                url.includes('auth/forgot-password') ||
                                url.includes('auth/reset-password');

                            // Kiểm tra xem có phải là endpoint đăng nhập không
                            const isLoginEndpoint = url.includes('/auth/tokens');

                            if (isPublicEndpoint || isLoginEndpoint) {
                                console.log('Không chuyển hướng đến trang đăng nhập cho endpoint: ' + url);
                                break;
                            }

                            const refreshToken = localStorage.getItem(TOKEN_STORAGE.REFRESH_TOKEN);
                            if (refreshToken) {
                                // Thử làm mới token
                                authService.refreshToken().then(result => {
                                    if (result) {
                                        // Nếu làm mới thành công, reload trang để thử lại request
                                        window.location.reload();
                                    } else {
                                        // Nếu làm mới thất bại, đăng xuất
                                        localStorage.removeItem(TOKEN_STORAGE.ACCESS_TOKEN);
                                        localStorage.removeItem(TOKEN_STORAGE.REFRESH_TOKEN);
                                        localStorage.removeItem(TOKEN_STORAGE.TOKEN_EXPIRY);

                                        // Chỉ chuyển hướng nếu không đang ở trang đăng nhập
                                        if (!window.location.pathname.includes('/login')) {
                                            window.location.href = '/login';
                                            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                                        }
                                    }
                                });
                            } else {
                                // Không có refresh token, đăng xuất luôn
                                localStorage.removeItem(TOKEN_STORAGE.ACCESS_TOKEN);

                                // Chỉ chuyển hướng nếu không đang ở trang đăng nhập
                                if (!window.location.pathname.includes('/login')) {
                                    window.location.href = '/login';
                                    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                                }
                            }
                            break; }
                        case 403:
                            // Forbidden
                            // Kiểm tra xem có phải lỗi tài khoản bị khóa không
                            if (data && data.code === 1007) {
                                toast.error('Tài khoản của bạn đã bị khóa');

                                // Đăng xuất người dùng
                                localStorage.removeItem(TOKEN_STORAGE.ACCESS_TOKEN);
                                localStorage.removeItem(TOKEN_STORAGE.REFRESH_TOKEN);
                                localStorage.removeItem(TOKEN_STORAGE.TOKEN_EXPIRY);

                                // Chuyển hướng đến trang đăng nhập
                                if (!window.location.pathname.includes('/login')) {
                                    window.location.href = '/login';
                                }
                            } else {
                                toast.error('Bạn không có quyền thực hiện hành động này.');
                            }
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
                            { const message = data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
                            toast.error(message); }
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
    async get(url, config) {
        const response = await this.instance.get(url, config);
        return response.data;
    }

    // POST request
    async post(url, data, config) {
        const response = await this.instance.post(url, data, config);
        return response.data;
    }

    // PUT request
    async put(url, data, config) {
        const response = await this.instance.put(url, data, config);
        return response.data;
    }

    // DELETE request
    async delete(url, config) {
        const response = await this.instance.delete(url, config);
        return response.data;
    }

    // PATCH request
    async patch(url, data, config) {
        const response = await this.instance.patch(url, data, config);
        return response.data;
    }
}

// Create instances for each service
export const identityHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.IDENTITY_SERVICE}`);
export const mangaHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.MANGA_SERVICE}`);
export const profileHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.PROFILE_SERVICE}`);
export const historyHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.HISTORY_SERVICE}`);
export const commentHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.COMMENT_SERVICE}`);
export const favoriteHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.FAVORITE_SERVICE}`);

export default HttpClient;
