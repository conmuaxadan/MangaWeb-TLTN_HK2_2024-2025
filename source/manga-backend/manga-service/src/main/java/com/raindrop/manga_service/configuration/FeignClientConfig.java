package com.raindrop.manga_service.configuration;

import feign.Client;
import feign.Logger;
import feign.Request;
import feign.codec.Encoder;
import feign.form.spring.SpringFormEncoder;
import lombok.RequiredArgsConstructor;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.springframework.beans.factory.ObjectFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.http.HttpMessageConverters;
import org.springframework.cloud.openfeign.support.SpringEncoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Scope;

import java.util.concurrent.TimeUnit;

@Configuration
@RequiredArgsConstructor
public class FeignClientConfig {

    private final ObjectFactory<HttpMessageConverters> messageConverters;

    @Value("${feign.client.config.upload-service.connectTimeout:60000}")
    private int connectTimeout;

    @Value("${feign.client.config.upload-service.readTimeout:60000}")
    private int readTimeout;

    @Value("${spring.servlet.multipart.max-file-size:50MB}")
    private String maxFileSize;

    @Bean
    @Primary
    @Scope("prototype")
    public Encoder feignFormEncoder() {
        return new SpringFormEncoder(new SpringEncoder(messageConverters));
    }

    @Bean
    public Client feignClient() {
        // Cấu hình HttpClient với buffer size lớn
        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectTimeout(connectTimeout)
                .setSocketTimeout(readTimeout)
                .build();

        CloseableHttpClient httpClient = HttpClientBuilder.create()
                .setDefaultRequestConfig(requestConfig)
                .disableContentCompression() // Tắt nén để xử lý file lớn
                .build();

        return new feign.httpclient.ApacheHttpClient(httpClient);
    }

    @Bean
    public Request.Options requestOptions() {
        return new Request.Options(
                connectTimeout, TimeUnit.MILLISECONDS,
                readTimeout, TimeUnit.MILLISECONDS,
                true);
    }

    /**
     * Chuyển đổi kích thước từ chuỗi (ví dụ: "50MB") sang byte
     */
    @Bean
    Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }

    private long parseSize(String size) {
        size = size.toUpperCase();
        long multiplier = 1;

        if (size.endsWith("KB")) {
            multiplier = 1024;
            size = size.substring(0, size.length() - 2);
        } else if (size.endsWith("MB")) {
            multiplier = 1024 * 1024;
            size = size.substring(0, size.length() - 2);
        } else if (size.endsWith("GB")) {
            multiplier = 1024 * 1024 * 1024;
            size = size.substring(0, size.length() - 2);
        }

        return Long.parseLong(size) * multiplier;
    }
}
