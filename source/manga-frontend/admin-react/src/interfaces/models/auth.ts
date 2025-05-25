// Authentication Request
export interface AuthRequest {
    username: string;
    password: string;
}

// Authentication Response
export interface AuthResponse {
    token: string;
    refreshToken: string;
    authenticated: boolean;
    expiresIn?: number; // Thời gian hết hạn của access token (tính bằng giây)
}

// Google Login Request
export interface GoogleLoginRequest {
    code: string;
    redirectUri: string;
}

// User Registration Request
export interface UserRegistrationRequest {
    username: string;
    password: string;
    email: string;
}

// User Response
export interface UserResponse {
    id: string;
    username: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
    roles: RoleResponse[];
    authProvider?: string; // LOCAL, GOOGLE, etc.
    createdAt?: string;
    updatedAt?: string;
    enabled?: boolean; // Trạng thái tài khoản: true = đang hoạt động, false = bị khóa
}

// User Page Response (for server-side pagination)
export interface UserPageResponse {
    content: UserResponse[];
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
    numberOfElements?: number;
    empty?: boolean;
}

// User Request (for create/update)
export interface UserRequest {
    username: string;
    password: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
    roles: number[];
}

// User Filter
export interface UserFilter {
    username?: string;
    email?: string;
    role?: string;
    authProvider?: string;
}

// Role Response
export interface RoleResponse {
    id: number;
    name: string;
    description: string;
    permissions?: PermissionResponse[];
}

// Permission Response
export interface PermissionResponse {
    id?: number;
    name: string;
    description?: string;
}

// Role Request (for create/update)
export interface RoleRequest {
    name: string;
    permissions: number[];
    description: string;
}

// Refresh Token Request
export interface RefreshTokenRequest {
    refreshToken: string;
}

// Google Link Request
export interface GoogleLinkRequest {
    code: string;
    redirectUri: string;
}

// Link Local Account Request
export interface LinkLocalAccountRequest {
    username: string;
    email: string;
    password: string;
}

// Linked Account Response
export interface LinkedAccountResponse {
    id: string;
    provider: string; // LOCAL, GOOGLE, etc.
    username?: string;
    email?: string;
    providerUserId?: string;
    linkedAt: string | Date; // Hỗ trợ cả string và Date để tương thích với backend
}

// Toggle User Status Request
export interface ToggleUserStatusRequest {
    userId: string;
    enabled: boolean;
}
