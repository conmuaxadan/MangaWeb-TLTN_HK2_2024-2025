/**
 * Cấp độ log
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}

/**
 * Cấu hình logger
 */
interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
}

/**
 * Cấu hình mặc định
 */
const defaultConfig: LoggerConfig = {
    level: process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG,
    enableConsole: process.env.NODE_ENV !== 'production'
};

/**
 * Cấu hình hiện tại
 */
let currentConfig: LoggerConfig = { ...defaultConfig };

/**
 * Cấu hình logger
 * @param config Cấu hình mới
 */
export const configureLogger = (config: Partial<LoggerConfig>): void => {
    currentConfig = { ...currentConfig, ...config };
};

/**
 * Logger
 */
export const logger = {
    /**
     * Log debug message
     * @param message Message
     * @param args Arguments
     */
    debug: (message: string, ...args: unknown[]): void => {
        if (currentConfig.level <= LogLevel.DEBUG && currentConfig.enableConsole) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    },

    /**
     * Log info message
     * @param message Message
     * @param args Arguments
     */
    info: (message: string, ...args: unknown[]): void => {
        if (currentConfig.level <= LogLevel.INFO && currentConfig.enableConsole) {
            console.info(`[INFO] ${message}`, ...args);
        }
    },

    /**
     * Log warning message
     * @param message Message
     * @param args Arguments
     */
    warn: (message: string, ...args: unknown[]): void => {
        if (currentConfig.level <= LogLevel.WARN && currentConfig.enableConsole) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    },

    /**
     * Log error message
     * @param message Message
     * @param args Arguments
     */
    error: (message: string, ...args: unknown[]): void => {
        if (currentConfig.level <= LogLevel.ERROR && currentConfig.enableConsole) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    },

    /**
     * Log API call
     * @param method HTTP method
     * @param url URL
     * @param data Request data
     */
    apiCall: (method: string, url: string, data?: unknown): void => {
        if (currentConfig.level <= LogLevel.DEBUG && currentConfig.enableConsole) {
            console.debug(`[API] ${method.toUpperCase()} ${url}`, data || '');
        }
    },

    /**
     * Log API response
     * @param method HTTP method
     * @param url URL
     * @param status Status code
     * @param data Response data
     */
    apiResponse: (method: string, url: string, status: number, data?: unknown): void => {
        if (currentConfig.level <= LogLevel.DEBUG && currentConfig.enableConsole) {
            console.debug(`[API] ${method.toUpperCase()} ${url} - ${status}`, data || '');
        }
    }
};
