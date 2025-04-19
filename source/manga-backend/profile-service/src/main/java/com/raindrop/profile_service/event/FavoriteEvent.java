package com.raindrop.profile_service.event;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FavoriteEvent {
    String mangaId;
    EventType eventType;
    
    public enum EventType {
        ADDED,
        REMOVED
    }
}
