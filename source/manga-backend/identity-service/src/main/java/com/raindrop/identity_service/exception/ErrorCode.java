package com.raindrop.identity_service.exception;

public enum ErrorCode {
    UNCATEGORIZED(9999, "Uncategorized"),
    INVALID_KEY(9998, "Invalid message key"),
    USER_EXISTED(1001, "User existed"),
    USER_NOT_EXISTED(1002, "User not existed"),
    USERNAME_INVALID(1003, "Username must be at least 6 characters"),
    PASSWORD_INVALID(1004, "Password must be at least 8 characters"),
    ;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    private int code;
    private String message;

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
