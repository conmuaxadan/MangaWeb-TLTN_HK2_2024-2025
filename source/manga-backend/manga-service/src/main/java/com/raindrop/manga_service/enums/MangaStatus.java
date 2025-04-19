package com.raindrop.manga_service.enums;

/**
 * Enum đại diện cho trạng thái của manga
 */
public enum MangaStatus {
    ONGOING("Đang tiến hành"),
    COMPLETED("Hoàn thành"),
    PAUSED("Tạm ngưng");
    
    private final String displayName;
    
    MangaStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * Chuyển đổi từ tên hiển thị sang enum
     * @param displayName Tên hiển thị
     * @return Enum tương ứng hoặc null nếu không tìm thấy
     */
    public static MangaStatus fromDisplayName(String displayName) {
        for (MangaStatus status : MangaStatus.values()) {
            if (status.getDisplayName().equalsIgnoreCase(displayName)) {
                return status;
            }
        }
        return null;
    }
}
