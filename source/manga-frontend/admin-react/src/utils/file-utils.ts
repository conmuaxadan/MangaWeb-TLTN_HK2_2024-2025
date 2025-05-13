import { API_CONFIG } from "../configurations/api-config";

/**
 * Lấy URL đầy đủ của ảnh manga
 * @param imagePath Đường dẫn tương đối của ảnh
 * @returns URL đầy đủ của ảnh
 */
export const getMangaImageUrl = (imagePath: string): string => {
    if (!imagePath) return '/images/default-manga-cover.jpg';
    
    // Nếu đường dẫn đã là URL đầy đủ hoặc là đường dẫn tương đối từ gốc, trả về nguyên bản
    if (imagePath.startsWith('http') || imagePath.startsWith('/')) {
        return imagePath;
    }
    
    // Nếu không, thêm tiền tố API_CONFIG.FILES_PATH
    return `${API_CONFIG.BASE_URL}${API_CONFIG.FILES_PATH}/${imagePath}`;
};

/**
 * Lấy URL đầy đủ của ảnh chapter
 * @param imagePath Đường dẫn tương đối của ảnh
 * @returns URL đầy đủ của ảnh
 */
export const getMangaPageUrl = (imagePath: string): string => {
    if (!imagePath) return '/images/default-page.jpg';
    
    // Nếu đường dẫn đã là URL đầy đủ hoặc là đường dẫn tương đối từ gốc, trả về nguyên bản
    if (imagePath.startsWith('http') || imagePath.startsWith('/')) {
        return imagePath;
    }
    
    // Nếu không, thêm tiền tố API_CONFIG.FILES_PATH
    return `${API_CONFIG.BASE_URL}${API_CONFIG.FILES_PATH}/${imagePath}`;
};

/**
 * Lấy URL đầy đủ của avatar người dùng
 * @param avatarPath Đường dẫn tương đối của avatar
 * @returns URL đầy đủ của avatar
 */
export const getAvatarUrl = (avatarPath?: string): string => {
    if (!avatarPath) return '/images/avt_default.jpg';
    
    // Nếu đường dẫn đã là URL đầy đủ hoặc là đường dẫn tương đối từ gốc, trả về nguyên bản
    if (avatarPath.startsWith('http') || avatarPath.startsWith('/')) {
        return avatarPath;
    }
    
    // Nếu không, thêm tiền tố API_CONFIG.FILES_PATH
    return `${API_CONFIG.BASE_URL}${API_CONFIG.FILES_PATH}/${avatarPath}`;
};
