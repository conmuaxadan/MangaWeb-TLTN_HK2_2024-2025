package com.raindrop.identity_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class TokenRedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    // Prefix cho blacklist token
    private static final String BLACKLIST_PREFIX = "blacklist:";

    // Prefix cho refresh token
    private static final String REFRESH_TOKEN_PREFIX = "refresh:";

    // Prefix cho user refresh tokens
    private static final String USER_REFRESH_TOKENS_PREFIX = "user:refresh:";

    // Prefix cho token-to-user mapping
    private static final String TOKEN_USER_PREFIX = "token:user:";

    public void addToBlacklist(String tokenId, long expirationTimeInSeconds) {
        String key = BLACKLIST_PREFIX + tokenId;
        redisTemplate.opsForValue().set(key, "1", expirationTimeInSeconds, TimeUnit.SECONDS);
    }

    public boolean isBlacklisted(String tokenId) {
        String key = BLACKLIST_PREFIX + tokenId;
        return redisTemplate.hasKey(key);
    }

    public void saveRefreshToken(String tokenId, String userId, String token, long expirationTimeInSeconds) {
        // Lưu refresh token với key là tokenId
        String tokenKey = REFRESH_TOKEN_PREFIX + tokenId;
        redisTemplate.opsForValue().set(tokenKey, token, expirationTimeInSeconds, TimeUnit.SECONDS);

        // Lưu danh sách refresh token của user
        String userTokensKey = USER_REFRESH_TOKENS_PREFIX + userId;
        redisTemplate.opsForSet().add(userTokensKey, tokenId);

        // Lưu mapping giữa token và userId
        String tokenUserKey = TOKEN_USER_PREFIX + token;
        redisTemplate.opsForValue().set(tokenUserKey, userId, expirationTimeInSeconds, TimeUnit.SECONDS);
    }

    public String getRefreshToken(String token) {
        // Trong trường hợp này, token là giá trị của refresh token, không phải tokenId
        // Chúng ta cần tìm tokenId tương ứng với token này
        // Nhưng hiện tại chúng ta chỉ cần kiểm tra xem token có tồn tại không
        // Và trả về chính token đó nếu tồn tại
        String tokenUserKey = TOKEN_USER_PREFIX + token;
        Object userId = redisTemplate.opsForValue().get(tokenUserKey);
        return userId != null ? token : null;
    }

    public String getUserIdFromToken(String token) {
        String tokenUserKey = TOKEN_USER_PREFIX + token;
        Object userId = redisTemplate.opsForValue().get(tokenUserKey);
        return userId != null ? userId.toString() : null;
    }

    public void removeRefreshToken(String tokenId, String userId) {
        // Lấy token value trước khi xóa
        String tokenKey = REFRESH_TOKEN_PREFIX + tokenId;
        Object tokenValue = redisTemplate.opsForValue().get(tokenKey);

        // Xóa refresh token
        redisTemplate.delete(tokenKey);

        // Xóa tokenId khỏi danh sách refresh token của user
        String userTokensKey = USER_REFRESH_TOKENS_PREFIX + userId;
        redisTemplate.opsForSet().remove(userTokensKey, tokenId);

        // Xóa mapping giữa token và userId
        if (tokenValue != null) {
            String tokenUserKey = TOKEN_USER_PREFIX + tokenValue.toString();
            redisTemplate.delete(tokenUserKey);
        }
    }

    public void revokeAllUserRefreshTokens(String userId) {
        String userTokensKey = USER_REFRESH_TOKENS_PREFIX + userId;

        // Lấy tất cả tokenId của user
        var tokenIds = redisTemplate.opsForSet().members(userTokensKey);
        if (tokenIds != null) {
            // Xóa tất cả refresh token và mapping
            for (Object tokenId : tokenIds) {
                String tokenKey = REFRESH_TOKEN_PREFIX + tokenId.toString();

                // Lấy token value trước khi xóa
                Object tokenValue = redisTemplate.opsForValue().get(tokenKey);

                // Xóa refresh token
                redisTemplate.delete(tokenKey);

                // Xóa mapping giữa token và userId
                if (tokenValue != null) {
                    String tokenUserKey = TOKEN_USER_PREFIX + tokenValue.toString();
                    redisTemplate.delete(tokenUserKey);
                }
            }

            // Xóa danh sách refresh token của user
            redisTemplate.delete(userTokensKey);
        }
    }
}
