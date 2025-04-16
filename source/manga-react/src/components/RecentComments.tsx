import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import profileService from '../services/profile-service';

interface Comment {
    id: string;
    content: string;
    username: string;
    userAvatarUrl?: string;
    createdAt: string;
    mangaId: string;
    mangaTitle: string;
    chapterId: string;
    chapterNumber: string;
}

const RecentComments = () => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLatestComments = async () => {
            try {
                setLoading(true);
                const response = await profileService.getLatestComments(10);

                if (response && response.result) {
                    // Chuyển đổi dữ liệu từ API sang định dạng phù hợp
                    const formattedComments = response.result.content.map((comment: any) => ({
                        id: comment.id,
                        content: comment.content,
                        username: comment.username,
                        userAvatarUrl: comment.userAvatarUrl,
                        createdAt: comment.createdAt,
                        mangaId: comment.mangaId,
                        mangaTitle: comment.mangaTitle,
                        chapterId: comment.chapterId,
                        chapterNumber: comment.chapterNumber
                    }));

                    setComments(formattedComments);
                    setError(null);
                } else {
                    // Nếu không có dữ liệu từ API, sử dụng dữ liệu mẫu
                    setComments(getSampleComments());
                }
            } catch (err) {
                console.error('Lỗi khi tải bình luận mới nhất:', err);
                setError('Không thể tải bình luận mới nhất');
                // Sử dụng dữ liệu mẫu khi có lỗi
                setComments(getSampleComments());
            } finally {
                setLoading(false);
            }
        };

        fetchLatestComments();
    }, []);

    // Hàm tạo dữ liệu mẫu khi API không có dữ liệu hoặc có lỗi
    const getSampleComments = (): Comment[] => [
        {
            id: '1',
            content: 'Truyện hay quá! Đọc mãi không chán.',
            username: 'Manga Lover',
            userAvatarUrl: 'default-avatar.jpg',
            createdAt: new Date().toISOString(),
            mangaId: '201',
            mangaTitle: 'Solo Leveling',
            chapterId: '301',
            chapterNumber: '150'
        },
        {
            id: '2',
            content: 'Nhân vật chính quá mạnh, mong chờ chapter tiếp theo!',
            username: 'Anime Fan',
            userAvatarUrl: 'default-avatar.jpg',
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 phút trước
            mangaId: '202',
            mangaTitle: 'One Piece',
            chapterId: '302',
            chapterNumber: '1050'
        },
        {
            id: '3',
            content: 'Cốt truyện hơi khó hiểu nhưng vẫn rất cuốn.',
            username: 'Manga Reader',
            userAvatarUrl: 'default-avatar.jpg',
            createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 giờ trước
            mangaId: '203',
            mangaTitle: 'Chainsaw Man',
            chapterId: '303',
            chapterNumber: '97'
        },
        {
            id: '4',
            content: 'Tranh vẽ đẹp quá, tác giả tài năng thật!',
            username: 'Art Lover',
            userAvatarUrl: 'default-avatar.jpg',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 giờ trước
            mangaId: '204',
            mangaTitle: 'Jujutsu Kaisen',
            chapterId: '304',
            chapterNumber: '180'
        },
        {
            id: '5',
            content: 'Mong chờ phần tiếp theo, không thể đợi thêm được nữa!',
            username: 'Impatient Reader',
            userAvatarUrl: 'default-avatar.jpg',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 giờ trước
            mangaId: '205',
            mangaTitle: 'Demon Slayer',
            chapterId: '305',
            chapterNumber: '205'
        }
    ];

    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 text-xl font-semibold text-white border-l-4 border-purple-600 pl-3">
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
                <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-300">
                    {error}
                </div>
            ) : comments.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-300">
                    Chưa có bình luận nào.
                </div>
            ) : (
                comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-800 rounded-lg p-4 mb-4 shadow-md">
                        <div className="mb-2">
                            <div className="line-clamp-2 font-medium text-sm">
                                <a className="text-purple-400 hover:text-purple-300 transition-colors" href={`/mangas/${comment.mangaId}/chapters/${comment.chapterId}`}>
                                    Chương {comment.chapterNumber}
                                </a> - <a className="text-white hover:text-purple-300 transition-colors" href={`/mangas/${comment.mangaId}`}>
                                    {comment.mangaTitle}
                                </a>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <img
                                    className="h-8 w-8 rounded-full border border-gray-600"
                                    src={comment.userAvatarUrl ? `http://localhost:8888/api/v1/upload/files/${comment.userAvatarUrl}` : '/images/avt_default.jpg'}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/images/avt_default.jpg';
                                    }}
                                />
                                <div className="max-w-[150px] truncate text-sm font-medium text-gray-300">
                                    {comment.username}
                                </div>
                            </div>
                            <div className="whitespace-nowrap text-xs text-gray-400">
                                {formatDistanceToNow(new Date(comment.createdAt), { locale: vi, addSuffix: true })}
                            </div>
                        </div>
                        <div className="overflow-hidden bg-gray-900 rounded-lg p-3">
                            <div className="relative overflow-hidden transition-all duration-500" style={{ maxHeight: '100px' }}>
                                <div className="w-full text-gray-200 text-sm">
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
