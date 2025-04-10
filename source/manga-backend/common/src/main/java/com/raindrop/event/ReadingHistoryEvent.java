package com.raindrop.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingHistoryEvent {
    private String userId;
    private String mangaId;
    private String chapterId;
    private Integer lastPage;
}
