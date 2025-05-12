package com.raindrop.identity_service.repository;

import com.raindrop.identity_service.entity.LinkedAccount;
import com.raindrop.identity_service.entity.User;
import com.raindrop.identity_service.enums.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository để thao tác với LinkedAccount entity
 */
@Repository
public interface LinkedAccountRepository extends JpaRepository<LinkedAccount, String> {
    Optional<LinkedAccount> findByProviderAndUsername(AuthProvider provider, String username);
    Optional<LinkedAccount> findByProviderAndEmail(AuthProvider provider, String email);
    Optional<LinkedAccount> findByProviderAndProviderUserId(AuthProvider provider, String providerUserId);
    
    boolean existsByProviderAndUsername(AuthProvider provider, String username);
    boolean existsByProviderAndEmail(AuthProvider provider, String email);
    boolean existsByProviderAndProviderUserId(AuthProvider provider, String providerUserId);
    
    List<LinkedAccount> findAllByUser(User user);
}
