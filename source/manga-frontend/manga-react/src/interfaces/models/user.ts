// User Response from Identity Service
export interface UserResponse {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    roles?: any[];
    authProvider?: string;
    createdAt?: string;
}

// User Profile Response
export interface UserProfileResponse {
    id: string;
    userId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Change Display Name Request
export interface ChangeDisplayNameRequest {
    displayName: string;
}

// Change Password Request
export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}
