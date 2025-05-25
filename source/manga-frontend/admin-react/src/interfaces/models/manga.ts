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
    // Trường cho xóa mềm
    deleted: boolean;
    deletedAt?: string;
    deletedBy?: string;
}

// Manga Response
export interface MangaManagementResponse {
    id: string;
    title: string;
    anotherTitle?: string;
    author: string;
    loves: number;
    views: number;
    comments: number;
    coverUrl?: string;
    description: string;
    genres: string[];
    chapters: number;
    yearOfRelease?: number;
    status?: MangaStatus;
    updatedAt: string;
    lastChapterAddedAt?: string;
    // Trường cho xóa mềm
    deleted: boolean;
    deletedAt?: string;
    deletedBy?: string;
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
    author?: string;
    coverUrl?: string;
    views?:number;
    loves?:number;
    comments?: number;
    createdAt?: string;
    lastChapterId?: string;
    lastChapterAddedAt?: string;
}

// Manga Statistics Response
export interface MangaStatisticsResponse {
    // Tổng số truyện (bao gồm cả đã xóa và chưa xóa)
    totalMangas: number;

    // Số truyện chưa bị xóa
    activeMangas: number;

    // Số truyện đã bị xóa
    deletedMangas: number;

    // Số truyện mới thêm trong ngày hôm nay
    newMangasToday: number;

    // Số truyện theo thể loại
    mangasByGenre: Record<string, number>;

    // Số truyện theo trạng thái
    mangasByStatus: Record<string, number>;
}

// Thêm các trường cho MangaSummaryResponse
export interface MangaSummaryResponseExtended extends MangaSummaryResponse {
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
    mangaTitle?: string;  // Thêm field này
    views: number;
    comments?: number;    // Thêm field này
    pages: ChapterPageResponse[];
    mangaId: string;
    updatedAt: string;
}

// Chapter Page Response
export interface ChapterPageResponse {
    index: number;
    pageUrl: string;
}

// Đã chuyển GenreResponse và GenreRequest sang file genre.ts

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

/**
 * Interface đơn giản cho kết quả tìm kiếm nhanh manga khi thêm chapter
 */
export interface MangaQuickSearchResponse {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
    highestChapterNumber: number;
    chapterCount: number;
}

