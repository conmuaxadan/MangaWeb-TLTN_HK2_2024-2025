package com.raindrop.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteEvent {
    private String userId;
    private String mangaId;
    private boolean isFavorite; // true: add to favorites, false: remove from favorites
}
