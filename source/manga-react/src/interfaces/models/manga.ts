// Manga Status Enum
export enum MangaStatus {
    ONGOING = "ONGOING",
    COMPLETED = "COMPLETED",
    PAUSED = "PAUSED"
}

// Manga Status Display Names
export const MangaStatusDisplayNames = {
    [MangaStatus.ONGOING]: "Đang tiến hành",
    [MangaStatus.COMPLETED]: "Hoàn thành",
    [MangaStatus.PAUSED]: "Tạm ngưng"
};

// Manga Response
export interface MangaResponse {
    id: string;
    title: string;
    anotherTitle?: string;
    author: string;
    loves: number;
    views: number;
    coverUrl?: string;
    description: string;
    genres: string[];
    chapters: string[];
    yearOfRelease?: number;
    status?: MangaStatus;
    updatedAt: string;
    lastChapterAddedAt?: string;
}

// Advanced Search Request
export interface AdvancedSearchRequest {
    title?: string;
    author?: string;
    genres?: string[];
    yearOfRelease?: number;
    status?: MangaStatus;
    orderBy?: string;
}

// Manga Summary Response
export interface MangaSummaryResponse {
    id: string;
    title: string;
    coverUrl?: string;
    lastChapterId?: string;
    lastChapterAddedAt?: string;
    lastChapterNumber?: number;
    yearOfRelease?: number;
    status?: MangaStatus;
    views?: number;
    loves?: number;
    comments?: number;
}

// Manga Request
export interface MangaRequest {
    title: string;
    author: string;
    description: string;
    genres: string[];
    chapters?: string[];
    yearOfRelease?: number;
    status?: MangaStatus;
}

// Chapter Response
export interface ChapterResponse {
    id?: string;
    chapterNumber: number;
    title: string;
    views: number;
    pages: ChapterPageResponse[];
    mangaId: string;
    updatedAt: string;
}

// Chapter Page Response
export interface ChapterPageResponse {
    index: number;
    pageUrl: string;
}

// Genre Response
export interface GenreResponse {
    name: string;
    description?: string;
}

// Genre Request
export interface GenreRequest {
    name: string;
    description?: string;
}

// Pagination
export interface PageRequest {
    page: number;
    size: number;
    sort?: string;
}

// Paginated Response
export interface PageResponse<T> {
    content: T[];
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
