// User Response from Identity Service
export interface UserResponse {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    roles?: any[];
    authProvider?: string;
    createdAt?: string;
}

// Reading History Request
export interface ReadingHistoryRequest {
    mangaId: string;
    chapterId: string;
}

// Anonymous Reading History Request
export interface AnonymousReadingHistoryRequest {
    mangaId: string;
    chapterId: string;
    sessionId: string;
}

// Anonymous Reading History Response
export interface AnonymousReadingHistoryResponse {
    id: string;
    sessionId: string;
    mangaId: string;
    chapterId: string;
    createdAt: string;
    updatedAt: string;
    mangaTitle: string;
    mangaCoverUrl?: string;
    chapterTitle?: string;
    chapterNumber: number;
}

// Reading History Response
export interface ReadingHistoryResponse {
    id: string;
    userId: string;
    mangaId: string;
    chapterId: string;
    // Không còn lưu lastPage nữa
    createdAt: string;
    updatedAt: string;
    mangaTitle: string;
    mangaCoverUrl?: string;
    chapterTitle?: string;
    chapterNumber: number;
    author?: string;
}

// Favorite Request
export interface FavoriteRequest {
    mangaId: string;
}

// Favorite Response
export interface FavoriteResponse {
    userId: string;
    mangaId: string;
    mangaTitle: string;
    mangaCoverUrl?: string;
    addedAt: string;
    author?: string;
    description?: string;
    views?: number;
    loves?: number;
    comments?: number;
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
    displayName: string; // Đây là displayName từ backend
    chapterId: string;
    mangaId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    userAvatarUrl?: string;
    mangaTitle?: string;
    chapterTitle?: string;
}

// Comment Page Response
export interface CommentPageResponse {
    content: CommentResponse[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            sorted: boolean;
            unsorted: boolean;
            empty: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

// Favorite Page Response
export interface FavoritePageResponse {
    content: FavoriteMangaResponse[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            sorted: boolean;
            unsorted: boolean;
            empty: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

// Reading History Page Response
export interface ReadingHistoryPageResponse {
    content: ReadingHistoryResponse[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            sorted: boolean;
            unsorted: boolean;
            empty: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}
