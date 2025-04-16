package com.raindrop.identity_service.enums;

/**
 * Enum định nghĩa các nhà cung cấp xác thực
 */
public enum AuthProvider {
    /**
     * Xác thực thông thường với username/password
     */
    LOCAL,
    
    /**
     * Xác thực qua Google
     */
    GOOGLE,
    
    /**
     * Xác thực qua Facebook
     */
    FACEBOOK
}
