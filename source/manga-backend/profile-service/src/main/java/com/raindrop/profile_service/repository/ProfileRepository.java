package com.raindrop.profile_service.repository;

import com.raindrop.profile_service.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, String> {
    // userId đã trở thành id của Profile, nên chỉ cần sử dụng findById
}
