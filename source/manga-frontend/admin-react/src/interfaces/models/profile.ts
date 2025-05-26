
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
    mangaTitle?: string;
    chapterTitle?: string;
}
export interface UserStatisticsResponse {
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    usersByAuthProvider: Record<string, number>;
    usersByDay: Record<string, number>;
}
