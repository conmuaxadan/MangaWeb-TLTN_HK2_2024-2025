package com.raindrop.upload_service.configuration;

import jakarta.servlet.MultipartConfigElement;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;

@Configuration
public class MultipartConfig {

    @Value("${spring.servlet.multipart.max-file-size:50MB}")
    private String maxFileSize;

    @Value("${spring.servlet.multipart.max-request-size:1000MB}")
    private String maxRequestSize;

    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        
        // Đặt kích thước tối đa cho mỗi file
        factory.setMaxFileSize(DataSize.parse(maxFileSize));
        
        // Đặt kích thước tối đa cho toàn bộ request
        factory.setMaxRequestSize(DataSize.parse(maxRequestSize));
        
        // Đặt ngưỡng kích thước để lưu file tạm thời vào đĩa
        factory.setFileSizeThreshold(DataSize.ofBytes(0));
        
        return factory.createMultipartConfig();
    }
}
