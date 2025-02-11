package com.raindrop.identity_service.repository;

import com.raindrop.identity_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Optional;

@Repository
public interface IUserRepository extends JpaRepository<User, String> {
    boolean existsByUsername(String username);
    Optional<User> findByUsername(String username);
}
