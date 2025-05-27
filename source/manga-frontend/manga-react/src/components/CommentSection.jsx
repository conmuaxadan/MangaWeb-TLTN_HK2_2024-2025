import React, {useState, useEffect, useCallback, useMemo} from 'react';
import commentService from '../services/comment-service.js';
import {useAuth} from '../contexts/AuthContext.jsx';
import {formatDistanceToNow} from 'date-fns';
import {vi} from 'date-fns/locale';
import {toast} from 'react-toastify';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUser, faPaperPlane, faClock} from '@fortawesome/free-solid-svg-icons';
import {getAvatarUrl} from '../utils/file-utils.js';
import {preventRapidClicks, apiThrottle} from '../utils/performance.js';
import Pagination from './Pagination.jsx';

// Memoized Comment Item Component
const CommentItem = React.memo(({comment}) => {
    const isTemporary = comment.id.startsWith('temp-');

    return (
        <div className={`bg-gray-700 rounded-lg p-4 transition-opacity ${
            isTemporary ? 'opacity-75' : ''
        }`}>
            <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
                    <img
                        src={getAvatarUrl(comment.userAvatarUrl)}
                        alt={comment.displayName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target;
                            target.src = '/images/avt_default.jpg';
                        }}
                    />
                </div>
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold text-white flex items-center">
                                {comment.displayName}
                                {isTemporary && (
                                    <span className="ml-2 text-xs text-gray-400">(Đang gửi...)</span>
                                )}
                            </h4>
                            <p className="text-xs text-gray-400 flex items-center">
                                <FontAwesomeIcon icon={faClock} className="mr-1"/>
                                {formatDistanceToNow(new Date(comment.createdAt), {
                                    addSuffix: true,
                                    locale: vi
                                })}
                            </p>
                        </div>
                    </div>
                    <p className="text-gray-200 mt-2 whitespace-pre-wrap">{comment.content}</p>
                </div>
            </div>
        </div>
    );
});

CommentItem.displayName = 'CommentItem';

const CommentSection = ({chapterId, mangaId}) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [commentText, setCommentText] = useState('');
    const {isLogin, user} = useAuth();
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10; // Fixed page size for comments

    // Lấy danh sách bình luận với memoization và throttling
    const fetchComments = useCallback(
        apiThrottle(async (pageNum = 0) => {
            setLoading(true);
            try {
                const response = await commentService.getCommentsByChapterId(chapterId, pageNum);

                // Khởi tạo một mảng rỗng nếu không có dữ liệu trả về
                const commentData = response?.content || [];
                setComments(commentData);

                // Cập nhật thông tin phân trang
                if (response) {
                    setTotalPages(response.totalPages || 0);
                    setTotalElements(response.totalElements || 0);
                    setCurrentPage(pageNum);
                } else {
                    setTotalPages(0);
                    setTotalElements(0);
                }
            } catch (error) {
                console.error('Lỗi khi tải bình luận:', error);
                toast.error('Không thể tải bình luận', {position: 'top-right'});
                setComments([]);
            } finally {
                setLoading(false);
            }
        }),
        [chapterId]
    );

    // Tải bình luận khi component được mount
    useEffect(() => {
        fetchComments();
    }, [chapterId]);

    // Gửi bình luận mới với optimistic updates và prevent rapid clicks
    const handleSubmitComment = useCallback(
        preventRapidClicks(async (e) => {
            e.preventDefault();

            if (!isLogin) {
                toast.error('Vui lòng đăng nhập để bình luận', {position: 'top-right'});
                return;
            }

            if (!commentText.trim()) {
                toast.error('Vui lòng nhập nội dung bình luận', {position: 'top-right'});
                return;
            }

            if (submitting) {
                return; // Prevent double submission
            }

            setSubmitting(true);
            const tempComment = {
                id: `temp-${Date.now()}`,
                content: commentText.trim(),
                displayName: user?.displayName || 'Bạn',
                userAvatarUrl: user?.avatarUrl || '',
                createdAt: new Date().toISOString(),
                mangaId,
                chapterId,
                userId: '',
                updatedAt: ''
            };

            // Optimistic update
            setComments(prev => [tempComment, ...prev]);
            const originalText = commentText;
            setCommentText('');

            try {
                const newComment = await commentService.createComment(
                    mangaId,
                    chapterId,
                    originalText
                );

                if (newComment) {
                    // Replace temp comment with real comment
                    setComments(prev =>
                        prev.map(comment =>
                            comment.id === tempComment.id ? newComment : comment
                        )
                    );
                    toast.success('Bình luận đã được đăng', {position: 'top-right'});
                } else {
                    throw new Error('Failed to create comment');
                }
            } catch (error) {
                console.error('Lỗi khi gửi bình luận:', error);
                // Rollback optimistic update
                setComments(prev => prev.filter(comment => comment.id !== tempComment.id));
                setCommentText(originalText);
                toast.error('Không thể gửi bình luận', {position: 'top-right'});
            } finally {
                setSubmitting(false);
            }
        }),
        [isLogin, commentText, submitting, user, mangaId, chapterId]
    );

    // Pagination handler tương thích với Pagination component
    const handlePageChange = useCallback(
        preventRapidClicks((pageNumber) => {
            if (!loading && pageNumber >= 0 && pageNumber < totalPages) {
                fetchComments(pageNumber);
            }
        }),
        [loading, totalPages, fetchComments]
    );

    // Memoized computed values
    const safeComments = useMemo(() =>
        Array.isArray(comments) ? comments : [],
        [comments]
    );

    const isFormDisabled = useMemo(() =>
        !isLogin || submitting,
        [isLogin, submitting]
    );

    const canSubmit = useMemo(() =>
        isLogin && commentText.trim().length > 0 && !submitting,
        [isLogin, commentText, submitting]
    );

    return (
        <div className="comment-section bg-gray-800 rounded-lg p-4 mt-8">
            <h3 className="text-xl font-semibold text-white mb-4">Bình luận</h3>

            {/* Form gửi bình luận */}
            <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="flex items-start">
                    <div
                        className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
                        {isLogin ? (
                            <img
                                src={getAvatarUrl(user?.avatarUrl)}
                                alt={user?.displayName || 'User'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <FontAwesomeIcon icon={faUser} className="text-gray-300"/>
                        )}
                    </div>
                    <div className="flex-grow">
            <textarea
                className={`w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-opacity ${
                    isFormDisabled ? 'opacity-50' : ''
                }`}
                rows={3}
                placeholder={
                    submitting
                        ? "Đang gửi bình luận..."
                        : isLogin
                            ? "Viết bình luận của bạn..."
                            : "Đăng nhập để bình luận"
                }
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={isFormDisabled}
                maxLength={1000}
            ></textarea>
                        <div className="flex justify-between items-center mt-2">
                            <div className="text-xs text-gray-400">
                                {commentText.length}/1000 ký tự
                            </div>
                            <button
                                type="submit"
                                className={`px-4 py-2 rounded-lg flex items-center transition-all ${
                                    canSubmit
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                } ${submitting ? 'opacity-75' : ''}`}
                                disabled={!canSubmit}
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faPaperPlane} className="mr-2"/>
                                        Gửi bình luận
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Danh sách bình luận */}
            <div className="space-y-4">
                {loading && safeComments.length === 0 ? (
                    <div className="text-center py-4">
                        <div
                            className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-400 mt-2">Đang tải bình luận...</p>
                    </div>
                ) : safeComments.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                        <p>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                    </div>
                ) : (
                    <>

                        {safeComments.map((comment) => (
                            <CommentItem key={comment.id} comment={comment} />
                        ))}


                        {/* Phân trang với Pagination component */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalElements={totalElements}
                            pageSize={pageSize}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
