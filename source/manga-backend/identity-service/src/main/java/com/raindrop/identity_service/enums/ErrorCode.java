package com.raindrop.identity_service.enums;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
@Getter
public enum ErrorCode {
    // Common errors (9000-9999)
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(9998, "Invalid message key", HttpStatus.BAD_REQUEST),
    VALIDATION_ERROR(9997, "Validation error", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND(9996, "Resource not found", HttpStatus.NOT_FOUND),
    METHOD_NOT_ALLOWED(9995, "Method not allowed", HttpStatus.METHOD_NOT_ALLOWED),
    MEDIA_TYPE_NOT_SUPPORTED(9994, "Media type not supported", HttpStatus.UNSUPPORTED_MEDIA_TYPE),
    MISSING_REQUEST_PARAMETER(9993, "Missing request parameter", HttpStatus.BAD_REQUEST),
    REQUEST_TIMEOUT(9992, "Request timeout", HttpStatus.REQUEST_TIMEOUT),
    SERVICE_UNAVAILABLE(9991, "Service unavailable", HttpStatus.SERVICE_UNAVAILABLE),

    // Authentication and Authorization errors (1000-1099)
    UNAUTHENTICATED(1000, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1001, "You don't have permission", HttpStatus.FORBIDDEN),
    INVALID_CREDENTIALS(1002, "Invalid username or password", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED(1003, "Token has expired", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID(1004, "Invalid token", HttpStatus.UNAUTHORIZED),
    TOKEN_REVOKED(1005, "Token has been revoked", HttpStatus.UNAUTHORIZED),
    SESSION_EXPIRED(1006, "Session has expired", HttpStatus.UNAUTHORIZED),
    ACCOUNT_LOCKED(1007, "Account is locked", HttpStatus.FORBIDDEN),
    ACCOUNT_DISABLED(1008, "Account is disabled", HttpStatus.FORBIDDEN),
    TOO_MANY_REQUESTS(1009, "Too many login attempts", HttpStatus.TOO_MANY_REQUESTS),
    TOKEN_REQUIRED(1010, "Token is required", HttpStatus.BAD_REQUEST),
    CODE_REQUIRED(1011, "Authorization code is required", HttpStatus.BAD_REQUEST),
    REDIRECT_URI_REQUIRED(1012, "Redirect URI is required", HttpStatus.BAD_REQUEST),
    USERNAME_REQUIRED(1013, "Username is required", HttpStatus.BAD_REQUEST),
    PASSWORD_REQUIRED(1014, "Password is required", HttpStatus.BAD_REQUEST),
    EMAIL_REQUIRED(1015, "Email is required", HttpStatus.BAD_REQUEST),

    // User related errors (1100-1199)
    USER_EXISTED(1100, "User already exists", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1101, "User does not exist", HttpStatus.NOT_FOUND),
    USERNAME_INVALID(1102, "Username can only contain letters, numbers, dots, underscores, and hyphens", HttpStatus.BAD_REQUEST),
    USERNAME_TOO_SHORT(1103, "Username must be at least 5 characters", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1104, "Password must contain at least one digit, one lowercase, one uppercase, and one special character", HttpStatus.BAD_REQUEST),
    PASSWORD_TOO_SHORT(1105, "Password must be at least 8 characters", HttpStatus.BAD_REQUEST),
    EMAIL_INVALID(1106, "Invalid email format", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1107, "Email already exists", HttpStatus.BAD_REQUEST),
    ROLE_NOT_FOUND(1108, "Role not found", HttpStatus.NOT_FOUND),
    INVALID_ROLE_ASSIGNMENT(1109, "Invalid role assignment", HttpStatus.BAD_REQUEST),

    // Google OAuth related errors (1200-1299)
    GOOGLE_AUTH_ERROR(1200, "Error during Google authentication", HttpStatus.BAD_REQUEST),
    GOOGLE_TOKEN_ERROR(1201, "Error exchanging Google code for token", HttpStatus.BAD_REQUEST),
    GOOGLE_USER_INFO_ERROR(1202, "Error retrieving user info from Google", HttpStatus.BAD_REQUEST),
    GOOGLE_EMAIL_NOT_VERIFIED(1203, "Google email not verified", HttpStatus.BAD_REQUEST),
    GOOGLE_INVALID_ID_TOKEN(1204, "Invalid Google ID token", HttpStatus.BAD_REQUEST),
    GOOGLE_USER_DISABLED(1205, "Google user is disabled", HttpStatus.FORBIDDEN),

    // Profile related errors (1300-1399)
    PROFILE_NOT_FOUND(1300, "Profile not found", HttpStatus.NOT_FOUND),
    PROFILE_UPDATE_FAILED(1301, "Failed to update profile", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_PROFILE_DATA(1302, "Invalid profile data", HttpStatus.BAD_REQUEST),

    // Communication errors (1400-1499)
    KAFKA_PUBLISH_ERROR(1400, "Failed to publish message to Kafka", HttpStatus.INTERNAL_SERVER_ERROR),
    SERVICE_COMMUNICATION_ERROR(1401, "Error communicating with another service", HttpStatus.INTERNAL_SERVER_ERROR),

    // Database errors (1500-1599)
    DATABASE_ERROR(1500, "Database error", HttpStatus.INTERNAL_SERVER_ERROR),
    TRANSACTION_FAILED(1501, "Transaction failed", HttpStatus.INTERNAL_SERVER_ERROR),
    DATA_INTEGRITY_VIOLATION(1502, "Data integrity violation", HttpStatus.BAD_REQUEST),
    OPTIMISTIC_LOCK_EXCEPTION(1503, "The resource was updated by another user", HttpStatus.CONFLICT),
    ;

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }

    private int code;
    private String message;
    private HttpStatusCode httpStatusCode;
}
