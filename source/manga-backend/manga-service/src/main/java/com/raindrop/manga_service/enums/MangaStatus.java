package com.raindrop.manga_service.enums;

import lombok.Getter;

/**
 * Enum đại diện cho trạng thái của manga
 */
@Getter
public enum MangaStatus {
    ONGOING("Đang tiến hành"),
    COMPLETED("Hoàn thành"),
    PAUSED("Tạm ngưng");
    
    private final String displayName;
    
    MangaStatus(String displayName) {
        this.displayName = displayName;
    }
}
