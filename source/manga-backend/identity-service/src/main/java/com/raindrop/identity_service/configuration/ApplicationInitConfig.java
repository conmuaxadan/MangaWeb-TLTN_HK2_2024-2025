package com.raindrop.identity_service.configuration;

import com.raindrop.common.event.UserProfileEvent;
import com.raindrop.identity_service.dto.request.UserProfileRequest;
import com.raindrop.identity_service.entity.Role;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.mapper.ProfileMapper;
import com.raindrop.identity_service.repository.RoleRepository;
import com.raindrop.identity_service.repository.UserRepository;
import com.raindrop.identity_service.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.raindrop.identity_service.kafka.UserProfileEventProducer;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashSet;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class ApplicationInitConfig {
    PasswordEncoder passwordEncoder;
    UserProfileEventProducer userProfileEventProducer;


    @Bean
    ApplicationRunner applicationRunner(UserRepository userRepository, RoleRepository roleRepository,
                                        ProfileClient profileClient, ProfileMapper profileMapper) {
        return args -> {
            if (!roleRepository.existsByName("USER")) {
                roleRepository.save(Role.builder().name("USER").build());
            }
            if (!roleRepository.existsByName("ADMIN")) {
                roleRepository.save(Role.builder().name("ADMIN").build());
            }
            if (!userRepository.existsByUsername("admin")) {
                var roles = new HashSet<Role>();
                roles.add(Role.builder().name("ADMIN").build());
                User user = User.builder()
                        .username("admin")
                        .email("jotaro903@gmail.com")
                        .password(passwordEncoder.encode("admin"))
                        .roles(roles)
                        .build();
                user = userRepository.save(user);

                UserProfileEvent profileEvent = UserProfileEvent.builder()
                        .userId(user.getId())
                        .email(user.getEmail())
                        .displayName(user.getUsername())
                        .avatarUrl(null)
                        .build();

                userProfileEventProducer.sendUserProfileEvent(profileEvent);

                log.warn("Admin user created with password: admin");
            }
        };
    }
}
