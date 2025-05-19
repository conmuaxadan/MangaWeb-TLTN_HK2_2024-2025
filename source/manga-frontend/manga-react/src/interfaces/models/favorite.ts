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
