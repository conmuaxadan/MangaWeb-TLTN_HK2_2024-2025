import { API_CONFIG } from '../configurations/api-config';

/**
 * Tạo URL đầy đủ cho file từ tên file
 * @param fileName Tên file
 * @returns URL đầy đủ của file
 */
export const getFileUrl = (fileName: string): string => {
    if (!fileName) return null;

    // Nếu fileName đã là URL đầy đủ, trả về nguyên vẹn
    if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
        return fileName;
    }

    return `${API_CONFIG.BASE_URL}${API_CONFIG.FILES_PATH}/${fileName}`;
};

/**
 * Tạo URL đầy đủ cho ảnh manga từ tên file
 * @param fileName Tên file ảnh manga
 * @returns URL đầy đủ của ảnh manga
 */
export const getMangaImageUrl = (fileName: string): string => {
    if (!fileName) return '/images/default-manga-cover.jpg';
    return getFileUrl(fileName);
};

/**
 * Tạo URL đầy đủ cho ảnh avatar từ tên file
 * @param fileName Tên file ảnh avatar
 * @returns URL đầy đủ của ảnh avatar
 */
export const getAvatarUrl = (fileName: string): string => {
    if (!fileName) return '/images/avt_default.jpg';
    return getFileUrl(fileName);
};

/**
 * Tạo URL đầy đủ cho ảnh trang manga từ tên file
 * @param fileName Tên file ảnh trang manga
 * @returns URL đầy đủ của ảnh trang manga
 */
export const getMangaPageUrl = (fileName: string): string => {
    if (!fileName) return '/images/default-manga-page.jpg';
    return getFileUrl(fileName);
};
