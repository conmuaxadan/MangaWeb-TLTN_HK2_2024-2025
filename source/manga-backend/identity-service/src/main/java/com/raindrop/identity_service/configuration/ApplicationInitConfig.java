package com.raindrop.identity_service.configuration;

import com.raindrop.identity_service.entity.Permission;
import com.raindrop.identity_service.entity.Role;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.enums.AuthProvider;
import com.raindrop.identity_service.repository.RoleRepository;
import com.raindrop.identity_service.repository.UserRepository;
import com.raindrop.identity_service.repository.PermissionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ApplicationInitConfig {
    PasswordEncoder passwordEncoder;

    @Bean
    @Transactional
    ApplicationRunner applicationRunner(UserRepository userRepository, RoleRepository roleRepository, PermissionRepository permissionRepository) {
        return args -> {
            if (!permissionRepository.existsByName("MANGA_MANAGEMENT")) {
                permissionRepository.save(Permission.builder().name("MANGA_MANAGEMENT")
                        .description("Quản lý truyện, chương, thể loại")
                        .build());
            }
            if (!permissionRepository.existsByName("SYSTEM_MANAGEMENT")) {
                permissionRepository.save(Permission.builder().name("SYSTEM_MANAGEMENT")
                        .description("Quản lý người dùng, vai trò, quyền hạn, bình luận, thống kê")
                        .build());
            }

            // Thêm permission mới cho translator
            if (!permissionRepository.existsByName("TRANSLATOR_MANAGEMENT")) {
                permissionRepository.save(Permission.builder().name("TRANSLATOR_MANAGEMENT")
                        .description("Quyền dịch và quản lý truyện của riêng mình")
                        .build());
            }

            // Tạo các role nếu chưa tồn tại
            if (!roleRepository.existsByName("USER")) {
                roleRepository.save(Role.builder().name("USER").build());
            }
            if (!roleRepository.existsByName("ADMIN")) {
                roleRepository.save(Role.builder().name("ADMIN")
                        .permissions(Set.of(permissionRepository.findByName("MANGA_MANAGEMENT"),
                                permissionRepository.findByName("SYSTEM_MANAGEMENT")))
                        .description("Quản trị viên hệ thống")
                        .build());
            }

            if (!roleRepository.existsByName("MODERATOR")) {
                roleRepository.save(Role.builder().name("MODERATOR")
                        .permissions(Set.of(permissionRepository.findByName("MANGA_MANAGEMENT")))
                        .description("Cộng tác viên")
                        .build());
            }

            // Thêm role mới cho translator
            if (!roleRepository.existsByName("TRANSLATOR")) {
                roleRepository.save(Role.builder().name("TRANSLATOR")
                        .permissions(Set.of(permissionRepository.findByName("TRANSLATOR_MANAGEMENT")))
                        .description("Dịch giả")
                        .build());
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
            }
        };
    }
}
