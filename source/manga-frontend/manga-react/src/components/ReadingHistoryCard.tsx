import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faClock } from '@fortawesome/free-solid-svg-icons';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getMangaImageUrl } from '../utils/file-utils';
import { ReadingHistoryResponse } from '../interfaces/models/reading-history';

interface ReadingHistoryCardProps {
    history: ReadingHistoryResponse;
}

const ReadingHistoryCard: React.FC<ReadingHistoryCardProps> = ({ history }) => {
    return (
        <div>
            <div className="group">
                <figure className="clearfix">
                    <div className="relative mb-2">
                        <a title={history.mangaTitle} href={`/mangas/${history.mangaId}`} className="block">
                            <div style={{ position: 'relative', width: '100%', paddingBottom: '150%' }}>
                                <div className="overflow-hidden rounded-lg group-hover:shadow-lg" style={{ position: 'absolute', inset: 0 }}>
                                    {/* Gradient overlay */}
                                    <div className="absolute bottom-0 left-0 z-[1] h-3/5 w-full bg-gradient-to-t from-neutral-900 from-[15%] to-transparent transition-all duration-500 group-hover:h-3/4"></div>
                                    
                                    {/* Manga cover image */}
                                    <img
                                        src={history.mangaCoverUrl ? getMangaImageUrl(history.mangaCoverUrl) : '/images/default-manga-cover.jpg'}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[102%]"
                                        alt={history.mangaTitle}
                                        loading="lazy"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/images/default-manga-cover.jpg';
                                        }}
                                    />
                                </div>
                            </div>
                            
                            {/* Overlay content */}
                            <div className="absolute bottom-0 left-0 z-[2] w-full px-2 py-1.5">
                                <h3 className="mb-1 line-clamp-2 text-[12px] font-semibold leading-tight text-white transition group-hover:line-clamp-3">
                                    {history.mangaTitle}
                                </h3>
                                <p className="mb-1 text-[10px] text-gray-400 line-clamp-1">
                                    {history.author || 'Không rõ'}
                                </p>
                                
                                {/* Reading info with FontAwesome icons */}
                                <span className="flex items-center justify-between gap-[4px] text-[10px] text-gray-300">
                                    <span className="flex items-center gap-[4px]">
                                        <FontAwesomeIcon icon={faBook} className="text-green-500" />
                                        Ch.{history.chapterNumber}
                                    </span>
                                    <span className="flex items-center gap-[4px]">
                                        <FontAwesomeIcon icon={faClock} className="text-purple-400" />
                                        {formatDistanceToNow(new Date(history.updatedAt), { addSuffix: true, locale: vi }).replace('khoảng ', '')}
                                    </span>
                                </span>
                            </div>
                        </a>
                    </div>
                </figure>
            </div>
            
            {/* Continue reading button */}
            <a
                href={`/mangas/${history.mangaId}/chapters/${history.chapterId}`}
                className="justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex h-auto items-center gap-2 bg-green-600 px-3 py-2 text-[12px] text-white hover:bg-green-700 mt-2 w-full"
            >
                <span className="shrink-0">
                    <FontAwesomeIcon icon={faBook} />
                </span>
                Tiếp tục đọc
            </a>
        </div>
    );
};

export default ReadingHistoryCard;
