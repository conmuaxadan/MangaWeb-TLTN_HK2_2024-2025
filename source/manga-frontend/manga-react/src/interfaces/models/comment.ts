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
    displayName: string;
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
