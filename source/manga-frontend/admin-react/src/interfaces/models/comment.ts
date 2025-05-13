// Comment Response
export interface CommentResponse {
  id: string;
  content: string;
  userId: string;
  username: string;
  chapterId: string;
  mangaId: string;
  mangaTitle: string;
  chapterTitle: string;
  chapterNumber: string;
  userAvatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Comment Request
export interface CommentRequest {
  content: string;
  chapterId: string;
  mangaId: string;
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

// Comment Stats
export interface CommentStats {
  totalComments: number;
  commentsToday: number;
  mostCommentedManga: {
    id: string;
    title: string;
    comments: number;
  }[];
}
