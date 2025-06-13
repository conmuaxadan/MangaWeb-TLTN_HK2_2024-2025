import { useState, useEffect, useCallback } from 'react';
import commentService from '../services/comment-service.js';
import userService from '../services/user-service.js';
import { toast } from 'react-toastify';

export const useCommentManagement = () => {
  // State
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch comments
  const fetchComments = useCallback(async (page = 0) => {
    setIsLoading(true);
    try {
      let response = null;

      if (searchTerm) {
        // Tìm kiếm bình luận
        response = await commentService.searchComments(searchTerm, page, pageSize);
      } else {
        // Lấy tất cả bình luận
        response = await commentService.getAllComments(page, pageSize);
      }

      if (response) {
        setComments(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
        setCurrentPage(response.number);
      } else {
        toast.error('Không thể lấy danh sách bình luận', { position: 'top-right' });
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bình luận:', error);
      toast.error('Đã xảy ra lỗi khi lấy danh sách bình luận', { position: 'top-right' });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, pageSize]);

  // Fetch comments on mount and when search term changes
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchComments();
  };

  // Handle page change
  const handlePageChange = (page) => {
    // Spring Data JPA uses 0-based page indexing, but UI uses 1-based
    fetchComments(page - 1);
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      const success = await commentService.deleteComment(commentId);
      if (success) {
        // Refresh comments
        fetchComments(currentPage);
      }
    }
  };

  // Xử lý khóa/mở khóa tài khoản người dùng
  const handleToggleUserStatus = async (username, userId) => {
    // Tìm comment của người dùng để lấy trạng thái hiện tại
    const comment = comments.find(c => c.userId === userId);
    if (!comment) return;

    // Kiểm tra trạng thái hiện tại của người dùng
    const isEnabled = comment.userEnabled !== false;
    const action = isEnabled ? "khóa" : "mở khóa";

    if (window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản ${username}?`)) {
      try {
        // Gọi API để thay đổi trạng thái
        const updatedUser = await userService.toggleUserStatus(userId, !isEnabled);

        if (updatedUser) {
          // Cập nhật trạng thái trong tất cả các comment của người dùng này
          setComments(prevComments =>
            prevComments.map(c =>
              c.userId === userId
                ? {...c, userEnabled: !isEnabled}
                : c
            )
          );

          toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công`, { position: 'top-right' });
        }
      } catch (error) {
        console.error(`Lỗi khi ${action} tài khoản ${username}:`, error);
        toast.error(`Đã xảy ra lỗi khi ${action} tài khoản`, { position: 'top-right' });
      }
    }
  };

  // Reset search
  const resetSearch = () => {
    setSearchTerm('');
  };

  // Tính toán showingFrom và showingTo
  const showingFrom = totalElements > 0 ? (currentPage * pageSize) + 1 : 0;
  const showingTo = Math.min((currentPage + 1) * pageSize, totalElements);

  return {
    comments,
    isLoading,
    searchTerm,
    setSearchTerm,
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    setPageSize,
    showingFrom,
    showingTo,
    handleSearch,
    handlePageChange,
    handleDeleteComment,
    handleToggleUserStatus,
    resetSearch
  };
};
