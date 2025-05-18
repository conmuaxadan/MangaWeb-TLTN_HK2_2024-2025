import { ApiResponse } from "../interfaces/models/ApiResponse";
import { logApiCall } from "../utils/api-logger";
import { uploadHttpClient } from "./http-client";

class UploadService {
    /**
     * Xóa file ảnh
     * @param fileName Tên file cần xóa
     * @returns true nếu thành công, false nếu thất bại
     */
    async deleteFile(fileName: string): Promise<boolean> {
        logApiCall('deleteFile');
        try {
            // Kiểm tra nếu là file mặc định, không xóa
            if (fileName === 'default.jpg') {
                console.log('Không xóa file mặc định');
                return true;
            }

            // Nếu fileName là URL đầy đủ, cần trích xuất tên file
            if (fileName.includes('/')) {
                fileName = fileName.substring(fileName.lastIndexOf('/') + 1);
            }

            // Kiểm tra lại sau khi trích xuất
            if (fileName === 'default.jpg') {
                console.log('Không xóa file mặc định');
                return true;
            }

            const apiResponse = await uploadHttpClient.delete<ApiResponse<void>>(`/files/${fileName}`);

            if (apiResponse.code !== 1000) {
                console.error(`Không thể xóa file: ${fileName}`, apiResponse.message);
                return false;
            }

            return true;
        } catch (error) {
            console.error(`Lỗi xóa file ${fileName}:`, error);
            return false;
        }
    }
}

export default new UploadService();
