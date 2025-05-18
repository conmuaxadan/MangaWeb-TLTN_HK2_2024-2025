package com.raindrop.identity_service.configuration;

import com.raindrop.identity_service.entity.Role;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.enums.AuthProvider;
import com.raindrop.identity_service.repository.RoleRepository;
import com.raindrop.identity_service.repository.UserRepository;
import com.raindrop.identity_service.repository.PermissionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class ApplicationInitConfig {
    PasswordEncoder passwordEncoder;

    @Bean
    @Transactional
    ApplicationRunner applicationRunner(UserRepository userRepository, RoleRepository roleRepository, PermissionRepository permissionRepository) {
        return args -> {
            // Tạo các role nếu chưa tồn tại
            if (!roleRepository.existsByName("USER")) {
                roleRepository.save(Role.builder().name("USER").build());
            }
            if (!roleRepository.existsByName("ADMIN")) {
                roleRepository.save(Role.builder().name("ADMIN").build());
            }

            // Tạo admin user nếu chưa tồn tại
            if (!userRepository.existsByUsername("admin")) {
                // Lấy ADMIN role và tạo user với role này
                Role adminRole = roleRepository.findByName("ADMIN");

                User user = User.builder()
                        .username("admin")
                        .email("jotaro903@gmail.com")
                        .displayName("admin")
                        .avatarUrl("default.jpg")
                        .password(passwordEncoder.encode("admin"))
                        .build();

                user.setAuthProvider(AuthProvider.LOCAL);
                user.setRoles(Set.of(adminRole));

                user = userRepository.save(user);
                log.warn("Admin user created with password: admin");
            }
        };
    }
}
