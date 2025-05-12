package com.raindrop.profile_service.service;

import com.raindrop.profile_service.dto.request.ProfileRequest;
import com.raindrop.profile_service.dto.request.UpdateProfileRequest;
import com.raindrop.profile_service.dto.response.ApiResponse;
import com.raindrop.profile_service.dto.response.FileInfoResponse;
import com.raindrop.profile_service.dto.response.ProfileResponse;
import com.raindrop.profile_service.entity.Profile;
import com.raindrop.profile_service.repository.httpclient.UploadClient;
import com.raindrop.profile_service.mapper.ProfileMapper;
import com.raindrop.profile_service.repository.ProfileRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ProfileService {
    ProfileRepository profileRepository;
    ProfileMapper userProfileMapper;
    UploadClient uploadClient;

    public ProfileResponse createProfile(ProfileRequest profileRequest) {
        Profile profile = userProfileMapper.toUserProfile(profileRequest);
        profile.setAvatarUrl("default.jpg");
        profileRepository.save(profile);
        return userProfileMapper.toUserProfileResponse(profile);
    }

    public ProfileResponse getProfile(String id) {
        Profile profile = profileRepository.findById(id).orElseThrow(() -> new RuntimeException("User profile not found"));
        return userProfileMapper.toUserProfileResponse(profile);
    }

    /**
     * Lấy thông tin profile của người dùng theo user ID
     * @param userId ID của người dùng (từ identity service)
     * @return Thông tin profile của người dùng
     */
    public ProfileResponse getProfileByUserId(String userId) {
        // Bây giờ userId chính là id của UserProfile
        return getProfile(userId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<ProfileResponse> getAllProfiles() {
        return profileRepository.findAll().stream().map(userProfileMapper::toUserProfileResponse).collect(Collectors.toList());
    }

    /**
     * Cập nhật thông tin profile của người dùng
     * @param userId ID của người dùng (từ identity service)
     * @param request Thông tin cần cập nhật
     * @return Thông tin profile đã cập nhật
     */
    public ProfileResponse updateProfile(String userId, UpdateProfileRequest request) {
        log.info("Updating profile for user ID: {}", userId);

        // Lấy thông tin profile của người dùng (userId chính là id của UserProfile)
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found for user ID: " + userId));

        // Cập nhật thông tin
        profile.setDisplayName(request.getDisplayName());

        // Lưu vào database
        profile = profileRepository.save(profile);
        log.info("Profile updated successfully for user ID: {}", userId);

        return userProfileMapper.toUserProfileResponse(profile);
    }

    /**
     * Cập nhật ảnh đại diện của người dùng
     * @param userId ID của người dùng (từ identity service)
     * @param file File ảnh đại diện
     * @return Thông tin profile đã cập nhật
     */
    public ProfileResponse updateAvatar(String userId, MultipartFile file) {
        log.info("Updating avatar for user ID: {}", userId);

        // Kiểm tra file
        if (file.isEmpty()) {
            throw new RuntimeException("Avatar file is empty");
        }

        // Kiểm tra loại file
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }

        // Lấy thông tin profile của người dùng (userId chính là id của UserProfile)
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found for user ID: " + userId));

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        var header = attributes.getRequest().getHeader("Authorization");

        try {
            // Xóa ảnh cũ nếu có
            String oldAvatarUrl = profile.getAvatarUrl();
            if (oldAvatarUrl != null && !oldAvatarUrl.isEmpty()) {
                try {
                    uploadClient.deleteFile(header,oldAvatarUrl);
                    log.info("Deleted old avatar: {}", oldAvatarUrl);
                } catch (Exception e) {
                    log.warn("Failed to delete old avatar: {}", oldAvatarUrl, e);
                }
            }

            // Upload ảnh mới
            ApiResponse<FileInfoResponse> uploadResponse = uploadClient.uploadAvatar(header,file);
            if (uploadResponse.getCode() != 1000 || uploadResponse.getResult() == null) {
                throw new RuntimeException("Failed to upload avatar: " + uploadResponse.getMessage());
            }

            String newAvatarUrl = uploadResponse.getResult().getName();
            log.info("Uploaded new avatar: {}", newAvatarUrl);

            // Cập nhật URL ảnh đại diện
            profile.setAvatarUrl(newAvatarUrl);

            // Lưu vào database
            profile = profileRepository.save(profile);
            log.info("Avatar updated successfully for user ID: {}", userId);

            return userProfileMapper.toUserProfileResponse(profile);
        } catch (Exception e) {
            log.error("Error updating avatar for user ID: {}", userId, e);
            throw new RuntimeException("Failed to update avatar: " + e.getMessage());
        }
    }

}
