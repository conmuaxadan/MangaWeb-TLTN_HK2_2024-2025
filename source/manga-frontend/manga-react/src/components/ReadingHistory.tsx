import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface HistoryItem {
    id: string;
    title: string;
    coverUrl: string;
    lastReadChapter: string;
    lastReadAt: string;
}

const ReadingHistory = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        // Lấy lịch sử đọc từ localStorage
        const loadHistory = () => {
            try {
                const historyData = localStorage.getItem('readingHistory');
                if (historyData) {
                    const parsedHistory = JSON.parse(historyData);
                    // Lấy 4 item mới nhất
                    setHistory(parsedHistory.slice(0, 4));
                }
            } catch (error) {
                console.error('Lỗi khi tải lịch sử đọc truyện:', error);
            }
        };

        loadHistory();
    }, []);

    // Nếu không có lịch sử, tạo dữ liệu mẫu
    useEffect(() => {
        if (history.length === 0) {
            const sampleHistory: HistoryItem[] = [
                {
                    id: '1',
                    title: 'Solo Leveling',
                    coverUrl: 'solo-leveling-cover.jpg',
                    lastReadChapter: 'Chapter 100',
                    lastReadAt: new Date().toISOString()
                },
                {
                    id: '2',
                    title: 'One Piece',
                    coverUrl: 'one-piece-cover.jpg',
                    lastReadChapter: 'Chapter 1050',
                    lastReadAt: new Date().toISOString()
                },
                {
                    id: '3',
                    title: 'Jujutsu Kaisen',
                    coverUrl: 'jujutsu-kaisen-cover.jpg',
                    lastReadChapter: 'Chapter 180',
                    lastReadAt: new Date().toISOString()
                },
                {
                    id: '4',
                    title: 'Chainsaw Man',
                    coverUrl: 'chainsaw-man-cover.jpg',
                    lastReadChapter: 'Chapter 97',
                    lastReadAt: new Date().toISOString()
                }
            ];
            setHistory(sampleHistory);
        }
    }, [history]);

    if (history.length === 0) {
        return null;
    }

    return (
        <div>
            <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-4 text-[20px] font-medium text-gray-300">
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path d="M504 255.531c.253 136.64-111.18 248.372-247.82 248.468-59.015.042-113.223-20.53-155.822-54.911-11.077-8.94-11.905-25.541-1.839-35.607l11.267-11.267c8.609-8.609 22.353-9.551 31.891-1.984C173.062 425.135 212.781 440 256 440c101.705 0 184-82.311 184-184 0-101.705-82.311-184-184-184-48.814 0-93.149 18.969-126.068 49.932l50.754 50.754c10.08 10.08 2.941 27.314-11.313 27.314H24c-8.837 0-16-7.163-16-16V38.627c0-14.254 17.234-21.393 27.314-11.314l49.372 49.372C129.209 34.136 189.552 8 256 8c136.81 0 247.747 110.78 248 247.531zm-180.912 78.784l9.823-12.63c8.138-10.463 6.253-25.542-4.21-33.679L288 256.349V152c0-13.255-10.745-24-24-24h-16c-13.255 0-24 10.745-24 24v135.651l65.409 50.874c10.463 8.137 25.541 6.253 33.679-4.21z"></path>
                        </svg>
                        Lịch sử đọc truyện
                    </h2>
                    <Link to="/history" className="text-gray-300 transition hover:text-purple-400">
                        Xem tất cả
                    </Link>
                </div>
                <ul className="grid grid-cols-4 gap-4">
                    {history.map((item) => (
                        <li key={item.id} className="group">
                            <div className="flex gap-3">
                                <Link 
                                    className="block w-full shrink-0" 
                                    title={item.title} 
                                    to={`/mangas/${item.id}`}
                                >
                                    <div style={{ position: 'relative', width: '100%', paddingBottom: '150%' }}>
                                        <div className="shrink-0 overflow-hidden rounded group-hover:shadow-lg" style={{ position: 'absolute', inset: 0 }}>
                                            <img 
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-[102%]" 
                                                alt={item.title} 
                                                src={`http://localhost:8888/api/v1/upload/files/${item.coverUrl}`} 
                                            />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ReadingHistory;
