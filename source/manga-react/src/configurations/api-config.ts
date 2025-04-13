// API Gateway configuration
export const API_CONFIG = {
    BASE_URL: 'http://localhost:8888/api/v1',
    IDENTITY_SERVICE: '/identity',
    MANGA_SERVICE: '/manga',
    PROFILE_SERVICE: '/profile',
};

// Timeout configuration (in milliseconds)
export const TIMEOUT = 30000;

// Default headers
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
};

// Authentication header
export const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};
