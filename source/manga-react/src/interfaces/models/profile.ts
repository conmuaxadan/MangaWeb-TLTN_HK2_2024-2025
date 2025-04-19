// User Profile Response
export interface UserProfileResponse {
    id: string;
    userId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    createdAt?: string;
    updatedAt?: string;
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

// Favorite Request
export interface FavoriteRequest {
    mangaId: string;
}

// Favorite Manga Response
export interface FavoriteMangaResponse {
    id: string;
    profileId: string;
    userId: string;
    username: string;
    mangaId: string;
    addedAt: string;
    mangaTitle: string;
    mangaCoverUrl?: string;
    author?: string;
    description?: string;
    views: number;
    loves: number;
    comments: number;
    lastChapterId?: string;
    lastChapterNumber?: string;
    lastChapterAddedAt?: string;
}

// Comment Request
export interface CommentRequest {
    mangaId: string;
    chapterId: string;
    content: string;
}

// Comment Response
export interface CommentResponse {
    id: string;
    userId: string;
    profileId?: string;
    username: string;
    chapterId: string;
    mangaId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    userAvatarUrl?: string;
}
