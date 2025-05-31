package com.raindrop.manga_service.enums;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    // Common errors (9000-9999)
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(9998, "Invalid message key", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(9001, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(9002, "You don't have permission", HttpStatus.FORBIDDEN),

    // Manga related errors (2000-2099)
    MANGA_NOT_FOUND(2001, "Manga not found", HttpStatus.NOT_FOUND),
    MANGA_ALREADY_EXISTS(2002, "Manga with this title already exists", HttpStatus.BAD_REQUEST),
    MANGA_INVALID_DATA(2003, "Invalid manga data", HttpStatus.BAD_REQUEST),
    MANGA_DELETE_ERROR(2004, "Error deleting manga", HttpStatus.INTERNAL_SERVER_ERROR),
    MANGA_ALREADY_DELETED(2005, "Manga is already deleted", HttpStatus.BAD_REQUEST),
    MANGA_NOT_DELETED(2006, "Manga is not deleted", HttpStatus.BAD_REQUEST),
    MANGA_RESTORE_ERROR(2007, "Error restoring manga", HttpStatus.INTERNAL_SERVER_ERROR),

    // Chapter related errors (2100-2199)
    CHAPTER_NOT_FOUND(2101, "Chapter not found", HttpStatus.NOT_FOUND),
    CHAPTER_ALREADY_EXISTS(2102, "Chapter with this number already exists for this manga", HttpStatus.BAD_REQUEST),
    CHAPTER_INVALID_DATA(2103, "Invalid chapter data", HttpStatus.BAD_REQUEST),
    CHAPTER_NO_PAGES(2104, "Chapter must have at least one page", HttpStatus.BAD_REQUEST),

    // Page related errors (2300-2399)
    PAGE_NOT_FOUND(2301, "Page not found", HttpStatus.NOT_FOUND),
    PAGE_INDEX_OUT_OF_RANGE(2302, "Page index is out of range", HttpStatus.BAD_REQUEST),
    PAGE_UPLOAD_FAILED(2303, "Failed to upload page", HttpStatus.INTERNAL_SERVER_ERROR),

    // Genre related errors (2200-2299)
    GENRE_NOT_FOUND(2201, "Genre not found", HttpStatus.NOT_FOUND),
    GENRE_ALREADY_EXISTS(2202, "Genre with this name already exists", HttpStatus.BAD_REQUEST),
    GENRE_INVALID_DATA(2203, "Invalid genre data", HttpStatus.BAD_REQUEST),
    GENRE_IN_USE(2204, "Genre is in use", HttpStatus.BAD_REQUEST),

    // File upload related errors (2400-2499)
    FILE_UPLOAD_FAILED(2401, "Failed to upload file", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_TYPE_NOT_SUPPORTED(2402, "File type not supported", HttpStatus.BAD_REQUEST),
    FILE_SIZE_EXCEEDED(2403, "File size exceeded", HttpStatus.BAD_REQUEST),
    COVER_UPLOAD_FAILED(2404, "Failed to upload cover image", HttpStatus.INTERNAL_SERVER_ERROR),

    // External service errors (2500-2599)
    UPLOAD_SERVICE_ERROR(2501, "Error communicating with upload service", HttpStatus.INTERNAL_SERVER_ERROR),

    // Authorization errors (2600-2699)
    UNAUTHORIZED_OPERATION(2601, "Bạn không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN);

    private final int code;
    private final String message;
    private final HttpStatusCode httpStatusCode;

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }
}
