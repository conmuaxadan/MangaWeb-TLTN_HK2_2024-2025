// Authentication Request
export interface AuthRequest {
    username: string;
    password: string;
}

// Authentication Response
export interface AuthResponse {
    token: string;
    authenticated: boolean;
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
