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
    createdAt: string;
    updatedAt: string;
    mangaTitle: string;
    mangaCoverUrl?: string;
    chapterTitle?: string;
    chapterNumber: number;
    author?: string;
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
