package com.raindrop.identity_service.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.raindrop.identity_service.enums.AuthProvider;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LinkedAccountResponse {
    String id;
    AuthProvider provider;
    String username;
    String email;
    String providerUserId;
    LocalDateTime linkedAt;
}
