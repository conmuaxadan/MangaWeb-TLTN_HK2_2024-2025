package com.raindrop.profile_service.mapper;

import com.raindrop.profile_service.dto.request.CommentRequest;
import com.raindrop.profile_service.dto.response.CommentResponse;
import com.raindrop.profile_service.entity.Comment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CommentMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userProfile", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Comment toComment(CommentRequest request);

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "userAvatarUrl", ignore = true)
    @Mapping(target = "mangaTitle", ignore = true)
    @Mapping(target = "chapterNumber", ignore = true)
    CommentResponse toCommentResponse(Comment comment);
}
