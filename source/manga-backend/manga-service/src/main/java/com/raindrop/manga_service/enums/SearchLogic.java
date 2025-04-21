package com.raindrop.manga_service.enums;

/**
 * Enum định nghĩa logic tìm kiếm
 */
public enum SearchLogic {
    /**
     * Logic OR - kết quả phải thỏa mãn ít nhất một điều kiện
     */
    OR,
    
    /**
     * Logic AND - kết quả phải thỏa mãn tất cả các điều kiện
     */
    AND
}
