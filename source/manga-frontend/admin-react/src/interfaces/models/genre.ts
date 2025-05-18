// Genre Request
export interface GenreRequest {
    name: string;
    description?: string;
}

// Genre Response
export interface GenreResponse {
    id?: number;
    name: string;
    description?: string;
}

// Genre Page Response
export interface GenrePageResponse {
    content: GenreResponse[];
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
