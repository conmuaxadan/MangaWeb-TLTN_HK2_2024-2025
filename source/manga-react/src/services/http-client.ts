import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, DEFAULT_HEADERS, TIMEOUT, getAuthHeader } from '../configurations/api-config';
import { toast } from 'react-toastify';

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
            (config: InternalAxiosRequestConfig) => {
                // Add auth header if token exists
                const authHeaders = getAuthHeader();
                if (authHeaders['Authorization']) {
                    if (config.headers) {
                        config.headers['Authorization'] = authHeaders['Authorization'];
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
            (error) => {
                // Handle errors
                if (error.response) {
                    // Server responded with an error status
                    const { status, data } = error.response;

                    switch (status) {
                        case 401:
                            // Unauthorized - clear token and redirect to login
                            localStorage.removeItem('token');
                            window.location.href = '/login';
                            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                            break;
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
    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.instance.get<T>(url, config);
        return response.data;
    }

    // POST request
    public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.instance.post<T>(url, data, config);
        return response.data;
    }

    // PUT request
    public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.instance.put<T>(url, data, config);
        return response.data;
    }

    // DELETE request
    public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.instance.delete<T>(url, config);
        return response.data;
    }

    // PATCH request
    public async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.instance.patch<T>(url, data, config);
        return response.data;
    }
}

// Create instances for each service
export const identityHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.IDENTITY_SERVICE}`);
export const mangaHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.MANGA_SERVICE}`);
export const profileHttpClient = new HttpClient(`${API_CONFIG.BASE_URL}${API_CONFIG.PROFILE_SERVICE}`);

export default HttpClient;
