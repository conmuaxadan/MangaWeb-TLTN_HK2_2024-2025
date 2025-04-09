package com.raindrop.identity_service.exception;

import com.raindrop.identity_service.dto.response.ApiResponse;
import com.raindrop.identity_service.enums.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse> handleRuntimeException() {
        ApiResponse response = new ApiResponse();
        response.setCode(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
        response.setMessage(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handleRuntimeException(AppException e) {
        ErrorCode errorCode = e.getErrorCode();
        ApiResponse response = new ApiResponse();
        response.setCode(errorCode.getCode());
        response.setMessage(errorCode.getMessage());
        return ResponseEntity.status(errorCode.getHttpStatusCode()).body(response);
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    ResponseEntity<ApiResponse> handleAccessDeniedException(AccessDeniedException exception) {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
        return ResponseEntity.status(errorCode.getHttpStatusCode()).body(ApiResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build());
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        // Lấy thông báo lỗi từ lỗi đầu tiên
        String defaultMessage = e.getFieldError().getDefaultMessage();
        String fieldName = e.getFieldError().getField();

        // Mặc định sử dụng VALIDATION_ERROR
        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;

        // Thử chuyển đổi thông báo lỗi thành enum ErrorCode
        try {
            errorCode = ErrorCode.valueOf(defaultMessage);
        } catch (IllegalArgumentException exception) {
            // Nếu không phải là tên của enum ErrorCode, sử dụng VALIDATION_ERROR
            log.warn("Validation message '{}' is not an ErrorCode enum name", defaultMessage);
        }

        // Tạo response với mã lỗi và thông báo phù hợp
        ApiResponse response = new ApiResponse();
        response.setCode(errorCode.getCode());

        return ResponseEntity.status(errorCode.getHttpStatusCode()).body(response);
    }
}
