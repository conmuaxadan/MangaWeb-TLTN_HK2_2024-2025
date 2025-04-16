package com.raindrop.api_gateway.configuration;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.raindrop.api_gateway.dto.response.ApiResponse;
import com.raindrop.api_gateway.service.IdentityService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationFilter implements GlobalFilter, Ordered {
    IdentityService identityService;
    ObjectMapper objectMapper;

    @NonFinal
    String[] publicEndpoints = {
            "/identity/users/register",
            "/identity/users/myInfo",
            "/identity/auth/login",
            "/identity/auth/introspect",
            "/identity/auth/google-login",
            "/manga/mangas",
            "/manga/mangas/paginated",
            "/manga/mangas/summaries",
            "/manga/mangas/{id}",
            "/manga/chapters",
            "/manga/chapters/manga/{mangaId}",
            "/manga/chapters/manga",
            "/manga/chapters/{id}",
            "/manga/chapters/{id}/view",
            "/manga/genres",
            "/manga/genres/{name}",
            "/profile/comments/chapter/{chapterId}",
            "/profile/comments/count/manga/{mangaId}",
            "/profile/comments/latest",
            "/upload/files",
            "/upload/files/{fileName}"
    };

    @Value("${app.api-prefix}")
    @NonFinal
    private String apiPrefix;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        log.info("AuthenticationFilter ...");

        if (isPublicEndpoint(exchange.getRequest()))
           return chain.filter(exchange);

        //get token
        List<String> authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION);
        if (CollectionUtils.isEmpty(authHeader)) {
            return unauthenticated(exchange.getResponse());
        }
        String token = authHeader.getFirst().replace("Bearer", "").trim();
        log.info("Token: {}", token);

        //verify token
        identityService.introspect(token).subscribe(introspectResponseApiResponse -> {
            log.info("Result: {}", introspectResponseApiResponse.getResult().isValid());
        });
        return identityService.introspect(token)
                .flatMap(introspectResponseApiResponse -> {
                    if (introspectResponseApiResponse.getResult().isValid()) {
                        return chain.filter(exchange);
                    } else {
                        return unauthenticated(exchange.getResponse());
                    }
                }).onErrorResume(throwable -> unauthenticated(exchange.getResponse()));
    }

    @Override
    public int getOrder() {
        return -1;
    }

    private boolean isPublicEndpoint(ServerHttpRequest request) {
        String path = request.getURI().getPath();
        log.info("Checking path: {}", path);

        return Arrays.stream(publicEndpoints).anyMatch(endpoint -> {
            // Nếu endpoint kết thúc bằng "/", kiểm tra xem path có bắt đầu bằng endpoint không
            if (endpoint.endsWith("/")) {
                return path.startsWith(apiPrefix + endpoint);
            }
            // Nếu endpoint là "/upload/files", kiểm tra xem path có bắt đầu bằng "/upload/files/" không
            else if (endpoint.equals("/upload/files")) {
                return path.startsWith(apiPrefix + endpoint + "/");
            }
            // Nếu endpoint chứa tham số "{id}", chuyển đổi thành biểu thức regex và kiểm tra
            else if (endpoint.contains("{") && endpoint.contains("}")) {
                String regex = apiPrefix + endpoint.replaceAll("\\{[^/]+\\}", "[^/]+");
                log.info("Regex pattern: {}, Path: {}, Matches: {}", regex, path, path.matches(regex));
                return path.matches(regex);
            }
            // Nếu không, kiểm tra xem path có khớp với endpoint không
            else {
                return path.equals(apiPrefix + endpoint);
            }
        });
    }

    Mono<Void> unauthenticated(ServerHttpResponse response) {
        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(1401)
                .message("Unauthenticated")
                .build();
        String body = null;
        try {
            body = objectMapper.writeValueAsString(apiResponse);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, "application/json");
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes())));
    }
}
