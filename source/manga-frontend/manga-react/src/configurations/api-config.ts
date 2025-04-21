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

// Token storage keys
export const TOKEN_STORAGE = {
    ACCESS_TOKEN: 'token',
    REFRESH_TOKEN: 'refreshToken',
    TOKEN_EXPIRY: 'tokenExpiry'
};

// Get token expiry timestamp
export const getTokenExpiry = (): number => {
    const expiry = localStorage.getItem(TOKEN_STORAGE.TOKEN_EXPIRY);
    return expiry ? parseInt(expiry, 10) : 0;
};

// Check if token is expired
export const isTokenExpired = (): boolean => {
    const expiry = getTokenExpiry();
    return expiry ? Date.now() > expiry : true;
};

// Set token expiry timestamp
export const setTokenExpiry = (expiresIn: number): void => {
    // expiresIn is in seconds, convert to milliseconds and add to current time
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(TOKEN_STORAGE.TOKEN_EXPIRY, expiryTime.toString());
};
