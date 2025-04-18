import React, { useState, useEffect } from 'react';
import { CommentResponse } from '../interfaces/models/profile';
import profileService from '../services/profile-service';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faTrash, faEdit, faPaperPlane, faClock } from '@fortawesome/free-solid-svg-icons';

interface CommentSectionProps {
  chapterId: string;
  mangaId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ chapterId, mangaId }) => {
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentText, setCommentText] = useState<string>('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const { isLogin, user } = useAuth();
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Lấy danh sách bình luận
  const fetchComments = async (pageNum: number = 0) => {
    setLoading(true);
    try {
      const response = await profileService.getCommentsByChapterId(chapterId, pageNum);

      // Khởi tạo một mảng rỗng nếu không có dữ liệu trả về
      const commentData = response?.result?.content || [];
      setComments(commentData);

      // Cập nhật thông tin phân trang
      if (response?.result) {
        setTotalPages(response.result.totalPages || 0);
        setTotalElements(response.result.totalElements || 0);
        setCurrentPage(pageNum);
      } else {
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error('Lỗi khi tải bình luận:', error);
      toast.error('Không thể tải bình luận', { position: 'top-right' });
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Tải bình luận khi component được mount
  useEffect(() => {
    fetchComments();
  }, [chapterId]);

  // Gửi bình luận mới
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      toast.error('Vui lòng đăng nhập để bình luận', { position: 'top-right' });
      return;
    }

    if (!commentText.trim()) {
      toast.error('Vui lòng nhập nội dung bình luận', { position: 'top-right' });
      return;
    }

    try {
      const newComment = await profileService.createComment({
        chapterId,
        mangaId,
        content: commentText
      });

      if (newComment) {
        setComments(prev => [newComment, ...prev]);
        setCommentText('');
        toast.success('Bình luận đã được đăng', { position: 'top-right' });
      }
    } catch (error) {
      console.error('Lỗi khi gửi bình luận:', error);
      toast.error('Không thể gửi bình luận', { position: 'top-right' });
    }
  };

  // Xóa bình luận
  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      const success = await profileService.deleteComment(commentId);
      if (success) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }
    }
  };

  // Bắt đầu chỉnh sửa bình luận
  const handleStartEdit = (comment: CommentResponse) => {
    setEditingCommentId(comment.id);
    setEditText(comment.content);
  };

  // Hủy chỉnh sửa
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  // Lưu bình luận đã chỉnh sửa
  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) {
      toast.error('Nội dung bình luận không được để trống', { position: 'top-right' });
      return;
    }

    const updatedComment = await profileService.updateComment(commentId, editText);
    if (updatedComment) {
      setComments(prev => prev.map(comment =>
        comment.id === commentId ? updatedComment : comment
      ));
      setEditingCommentId(null);
      setEditText('');
    }
  };

  // Chuyển đến trang trước
  const handlePrevPage = () => {
    if (!loading && currentPage > 0) {
      const prevPage = currentPage - 1;
      fetchComments(prevPage);
    }
  };

  // Chuyển đến trang tiếp theo
  const handleNextPage = () => {
    if (!loading && currentPage < totalPages - 1) {
      const nextPage = currentPage + 1;
      fetchComments(nextPage);
    }
  };

  // Chuyển đến trang cụ thể
  const handleGoToPage = (pageNumber: number) => {
    if (!loading && pageNumber >= 0 && pageNumber < totalPages) {
      fetchComments(pageNumber);
    }
  };

  // Đảm bảo comments luôn là một mảng
  const safeComments = Array.isArray(comments) ? comments : [];

  return (
    <div className="comment-section bg-gray-800 rounded-lg p-4 mt-8">
      <h3 className="text-xl font-semibold text-white mb-4">Bình luận</h3>

      {/* Form gửi bình luận */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
            {isLogin ? (
              <img
                src={user?.avatarUrl || "/images/avt_default.jpg"}
                alt={user?.displayName || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <FontAwesomeIcon icon={faUser} className="text-gray-300" />
            )}
          </div>
          <div className="flex-grow">
            <textarea
              className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder={isLogin ? "Viết bình luận của bạn..." : "Đăng nhập để bình luận"}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={!isLogin}
            ></textarea>
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg flex items-center ${
                  isLogin
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!isLogin}
              >
                <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                Gửi bình luận
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Danh sách bình luận */}
      <div className="space-y-4">
        {loading && safeComments.length === 0 ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Đang tải bình luận...</p>
          </div>
        ) : safeComments.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            <p>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-400 mb-4">
              Hiển thị {safeComments.length} / {totalElements} bình luận
            </div>
            {safeComments.map((comment) => (
              <div key={comment.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
                    <img
                      src={comment.userAvatarUrl || "/images/avt_default.jpg"}
                      alt={comment.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white">{comment.username}</h4>
                        <p className="text-xs text-gray-400 flex items-center">
                          <FontAwesomeIcon icon={faClock} className="mr-1" />
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                      {isLogin && user && comment.userId === user.id && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStartEdit(comment)}
                            className="text-gray-400 hover:text-blue-400 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                            title="Xóa"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="mt-2">
                        <textarea
                          className="w-full p-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end mt-2 space-x-2">
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-200 mt-2 whitespace-pre-wrap">{comment.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}


            {/* Phân trang */}
            {totalPages > 0 && (
              <div className="flex justify-center items-center mt-6 space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0 || loading}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  &laquo; Trước
                </button>

                {/* Hiển thị các nút trang */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Tính toán các trang để hiển thị
                  let pageToShow;
                  if (totalPages <= 5) {
                    // Nếu tổng số trang <= 5, hiển thị tất cả các trang
                    pageToShow = i;
                  } else if (currentPage < 3) {
                    // Nếu đang ở 3 trang đầu, hiển thị 5 trang đầu
                    pageToShow = i;
                  } else if (currentPage > totalPages - 3) {
                    // Nếu đang ở 3 trang cuối, hiển thị 5 trang cuối
                    pageToShow = totalPages - 5 + i;
                  } else {
                    // Hiển thị 2 trang trước, trang hiện tại, và 2 trang sau
                    pageToShow = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageToShow}
                      onClick={() => handleGoToPage(pageToShow)}
                      disabled={currentPage === pageToShow || loading}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        currentPage === pageToShow
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      {pageToShow + 1}
                    </button>
                  );
                })}

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1 || loading}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Tiếp &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
