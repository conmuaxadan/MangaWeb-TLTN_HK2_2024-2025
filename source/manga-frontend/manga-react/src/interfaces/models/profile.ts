// Re-export các interface từ các file khác để đảm bảo tính tương thích ngược
// Các file khác có thể vẫn đang import từ profile.ts

// User related interfaces
export type { UserResponse, UserProfileResponse, ChangeDisplayNameRequest, ChangePasswordRequest } from './user';

// Reading history related interfaces
export type {
    ReadingHistoryRequest,
    ReadingHistoryResponse,
    ReadingHistoryPageResponse,
    AnonymousReadingHistoryRequest,
    AnonymousReadingHistoryResponse
} from './reading-history';

// Favorite related interfaces
export type {
    FavoriteRequest,
    FavoriteResponse,
    FavoriteMangaResponse,
    FavoritePageResponse
} from './favorite';

// Comment related interfaces
export type {
    CommentRequest,
    CommentResponse,
    CommentPageResponse
} from './comment';
