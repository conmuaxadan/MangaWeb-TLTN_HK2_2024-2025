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
    roles: RoleResponse[];
    authProvider?: string; // LOCAL, GOOGLE, etc.
}

// Role Response
export interface RoleResponse {
    name: string;
    description?: string;
    permissions?: PermissionResponse[];
}

// Permission Response
export interface PermissionResponse {
    name: string;
    description?: string;
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
