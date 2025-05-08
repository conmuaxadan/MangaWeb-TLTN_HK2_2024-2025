package com.raindrop.profile_service.service;

import com.raindrop.profile_service.dto.request.UpdateProfileRequest;
import com.raindrop.profile_service.dto.request.UserProfileRequest;
import com.raindrop.profile_service.dto.response.ApiResponse;
import com.raindrop.profile_service.dto.response.FileInfoResponse;
import com.raindrop.profile_service.dto.response.UserProfileResponse;
import com.raindrop.profile_service.repository.httpclient.UploadClient;
import com.raindrop.profile_service.entity.UserProfile;
import com.raindrop.profile_service.mapper.UserProfileMapper;
import com.raindrop.profile_service.repository.UserProfileRepository;
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
public class UserProfileService {
    UserProfileRepository userProfileRepository;
    UserProfileMapper userProfileMapper;
    UploadClient uploadClient;

    public UserProfileResponse createProfile(UserProfileRequest userProfileRequest) {
        UserProfile userProfile = userProfileMapper.toUserProfile(userProfileRequest);
        userProfile.setAvatarUrl("default.jpg");
        userProfileRepository.save(userProfile);
        return userProfileMapper.toUserProfileResponse(userProfile);
    }

    public UserProfileResponse getProfile(String id) {
        UserProfile userProfile = userProfileRepository.findById(id).orElseThrow(() -> new RuntimeException("User profile not found"));
        return userProfileMapper.toUserProfileResponse(userProfile);
    }

    /**
     * Lấy thông tin profile của người dùng theo user ID
     * @param userId ID của người dùng (từ identity service)
     * @return Thông tin profile của người dùng
     */
    public UserProfileResponse getProfileByUserId(String userId) {
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found for user ID: " + userId));
        return userProfileMapper.toUserProfileResponse(userProfile);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserProfileResponse> getAllProfiles() {
        return userProfileRepository.findAll().stream().map(userProfileMapper::toUserProfileResponse).collect(Collectors.toList());
    }

    /**
     * Cập nhật thông tin profile của người dùng
     * @param userId ID của người dùng (từ identity service)
     * @param request Thông tin cần cập nhật
     * @return Thông tin profile đã cập nhật
     */
    public UserProfileResponse updateProfile(String userId, UpdateProfileRequest request) {
        log.info("Updating profile for user ID: {}", userId);

        // Lấy thông tin profile của người dùng
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found for user ID: " + userId));

        // Cập nhật thông tin
        userProfile.setDisplayName(request.getDisplayName());

        // Lưu vào database
        userProfile = userProfileRepository.save(userProfile);
        log.info("Profile updated successfully for user ID: {}", userId);

        return userProfileMapper.toUserProfileResponse(userProfile);
    }

    /**
     * Cập nhật ảnh đại diện của người dùng
     * @param userId ID của người dùng (từ identity service)
     * @param file File ảnh đại diện
     * @return Thông tin profile đã cập nhật
     */
    public UserProfileResponse updateAvatar(String userId, MultipartFile file) {
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

        // Lấy thông tin profile của người dùng
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found for user ID: " + userId));

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        var header = attributes.getRequest().getHeader("Authorization");

        try {
            // Xóa ảnh cũ nếu có
            String oldAvatarUrl = userProfile.getAvatarUrl();
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
            userProfile.setAvatarUrl(newAvatarUrl);

            // Lưu vào database
            userProfile = userProfileRepository.save(userProfile);
            log.info("Avatar updated successfully for user ID: {}", userId);

            return userProfileMapper.toUserProfileResponse(userProfile);
        } catch (Exception e) {
            log.error("Error updating avatar for user ID: {}", userId, e);
            throw new RuntimeException("Failed to update avatar: " + e.getMessage());
        }
    }

}
