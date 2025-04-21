package com.raindrop.manga_service.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

@Slf4j
public class SecurityUtils {
    
    /**
     * Lấy ID của người dùng hiện tại từ token
     * @return ID của người dùng hoặc null nếu không có người dùng đăng nhập
     */
    public static String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("No authenticated user found");
            return null;
        }
        
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof Jwt) {
            Jwt jwt = (Jwt) principal;
            return jwt.getSubject();
        }
        
        log.warn("Unable to extract user ID from authentication: {}", authentication);
        return null;
    }
}
