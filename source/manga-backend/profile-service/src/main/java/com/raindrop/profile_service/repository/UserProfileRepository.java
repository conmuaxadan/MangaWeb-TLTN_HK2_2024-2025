package com.raindrop.profile_service.repository;

import com.raindrop.profile_service.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfile, String> {

}
