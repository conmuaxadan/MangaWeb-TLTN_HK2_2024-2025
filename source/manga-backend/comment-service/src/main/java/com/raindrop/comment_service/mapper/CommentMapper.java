package com.raindrop.comment_service.mapper;

import com.raindrop.comment_service.dto.request.CommentRequest;
import com.raindrop.comment_service.dto.response.CommentResponse;
import com.raindrop.comment_service.entity.Comment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CommentMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Comment toComment(CommentRequest request);

    @Mapping(target = "mangaTitle", ignore = true)
    @Mapping(target = "chapterTitle", ignore = true)
    @Mapping(target = "chapterNumber", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "userAvatarUrl", ignore = true)
    CommentResponse toCommentResponse(Comment comment);
}
