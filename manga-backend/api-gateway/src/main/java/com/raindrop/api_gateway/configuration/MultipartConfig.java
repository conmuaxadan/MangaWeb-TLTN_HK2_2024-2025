package com.raindrop.api_gateway.configuration;

import org.springframework.boot.web.codec.CodecCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.codec.multipart.DefaultPartHttpMessageReader;
import org.springframework.http.codec.multipart.MultipartHttpMessageReader;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

import static org.springframework.web.reactive.function.server.RequestPredicates.POST;

@Configuration
public class MultipartConfig {

    @Bean
    public CodecCustomizer codecCustomizer() {
        return configurer -> {
            DefaultPartHttpMessageReader partReader = new DefaultPartHttpMessageReader();
            // Tăng kích thước buffer để xử lý file lớn
            partReader.setMaxParts(10);
            partReader.setMaxDiskUsagePerPart(50 * 1024 * 1024); // 50MB
            partReader.setMaxInMemorySize(10 * 1024 * 1024); // 10MB
            
            MultipartHttpMessageReader multipartReader = new MultipartHttpMessageReader(partReader);
            configurer.defaultCodecs().multipartReader(multipartReader);
        };
    }
}
