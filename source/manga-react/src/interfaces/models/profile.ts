// User Profile Response
export interface UserProfileResponse {
    id: string;
    displayName: string;
    avatarUrl?: string;
}

// User Profile Request
export interface UserProfileRequest {
    userId: string;
    email?: string;
    displayName: string;
    avatarUrl?: string;
}

// Reading History Request
export interface ReadingHistoryRequest {
    mangaId: string;
    chapterId: string;
    lastPageRead: number;
}

// Reading History Response
export interface ReadingHistoryResponse {
    id: string;
    userId: string;
    mangaId: string;
    lastChapterId: string;
    lastPageRead: number;
    lastReadAt: string;
    mangaTitle: string;
    mangaCoverUrl?: string;
    lastChapterNumber: number;
}

// Favorite Manga Response
export interface FavoriteMangaResponse {
    id: string;
    userId: string;
    mangaId: string;
    addedAt: string;
    mangaTitle: string;
    mangaCoverUrl?: string;
}
