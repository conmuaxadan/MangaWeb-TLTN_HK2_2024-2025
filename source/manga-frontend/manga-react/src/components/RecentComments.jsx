import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import commentService from '../services/comment-service.js';
import {getAvatarUrl} from "../utils/file-utils.js";

const RecentComments = () => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLatestComments = async () => {
            try {
                setLoading(true);
                const response = await commentService.getLatestComments(10);

                if (response) {
                    // Chuyển đổi dữ liệu từ API sang định dạng phù hợp
                    const formattedComments = response.content.map((comment) => ({
                        id: comment.id,
                        content: comment.content,
                        userId: comment.userId,
                        displayName: comment.displayName || comment.username || 'Người dùng', // Lấy displayName hoặc username từ response
                        userAvatarUrl: comment.userAvatarUrl,
                        createdAt: comment.createdAt,
                        mangaId: comment.mangaId,
                        mangaTitle: comment.mangaTitle,
                        chapterId: comment.chapterId,
                        chapterNumber: comment.chapterNumber
                    }));

                    // Log ra để kiểm tra dữ liệu
                    console.log('Comment data:', response.content);

                    setComments(formattedComments);
                    setError(null);
                }
            } catch (err) {
                console.error('Lỗi khi tải bình luận mới nhất:', err);
                setError('Không thể tải bình luận mới nhất');
            } finally {
                setLoading(false);
            }
        };

        fetchLatestComments();
    }, []);

    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 text-xl font-semibold text-gray-900 border-l-4 border-purple-600 pl-3">
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" className="text-purple-500 text-2xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.3-2.8 5.7-1.5 8.7S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4 32.7 12.3 69 19.4 107.4 19.4 141.4 0 256-93.1 256-208S397.4 32 256 32z"></path>
                    </svg>
                    Bình luận gần đây
                </h2>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            ) : error ? (
                <div className="bg-white rounded-lg p-4 text-center text-gray-600 border border-gray-200">
                    {error}
                </div>
            ) : comments.length === 0 ? (
                <div className="bg-white rounded-lg p-4 text-center text-gray-600 border border-gray-200">
                    Chưa có bình luận nào.
                </div>
            ) : (
                comments.map((comment) => (
                    <div key={comment.id} className="bg-white rounded-lg p-4 mb-4 shadow-md border border-gray-200">
                        <div className="mb-2">
                            <div className="line-clamp-2 font-medium text-sm">
                                <a className="text-purple-600 hover:text-purple-800 transition-colors" href={`/mangas/${comment.mangaId}/chapters/${comment.chapterId}`}>
                                    Chương {comment.chapterNumber}
                                </a> - <a className="text-gray-900 hover:text-purple-800 transition-colors" href={`/mangas/${comment.mangaId}`}>
                                    {comment.mangaTitle}
                                </a>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <img
                                    className="h-8 w-8 rounded-full border border-gray-300"
                                    src={getAvatarUrl(comment.userAvatarUrl)}
                                    onError={(e) => {
                                        const target = e.target;
                                        target.src = '/images/avt_default.jpg';
                                    }}
                                />
                                <div className="max-w-[150px] truncate text-sm font-medium text-gray-700">
                                    {comment.displayName}
                                </div>
                            </div>
                            <div className="whitespace-nowrap text-xs text-gray-500">
                                {formatDistanceToNow(new Date(comment.createdAt), { locale: vi, addSuffix: true })}
                            </div>
                        </div>
                        <div className="overflow-hidden bg-gray-100 rounded-lg p-3">
                            <div className="relative overflow-hidden transition-all duration-500" style={{ maxHeight: '100px' }}>
                                <div className="w-full text-gray-700 text-sm">
                                    <p>{comment.content}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                ))
            )}
        </div>
    );
};

export default RecentComments;
