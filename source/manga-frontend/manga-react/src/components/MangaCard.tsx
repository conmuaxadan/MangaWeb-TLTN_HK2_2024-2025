import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faComment, faHeart } from '@fortawesome/free-solid-svg-icons';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getMangaImageUrl } from '../utils/file-utils';
import { MangaSummaryResponse } from '../interfaces/models/manga';

interface MangaCardProps {
    manga: MangaSummaryResponse;
    formatCount: (count: number) => string;
}

const MangaCard: React.FC<MangaCardProps> = ({
    manga,
    formatCount
}) => {
    // Helper function to format time
    const formatTime = (dateString?: string) => {
        if (!dateString) return 'Chưa cập nhật';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Chưa cập nhật';
            return formatDistanceToNow(date, { addSuffix: true, locale: vi });
        } catch (error) {
            return 'Chưa cập nhật';
        }
    };

    // Get chapter info
    const getChapterInfo = () => {
        if (manga.lastChapterNumber) {
            return {
                text: `C. ${manga.lastChapterNumber}`,
                link: manga.lastChapterId
                    ? `/mangas/${manga.id}/chapters/${manga.lastChapterId}`
                    : `/mangas/${manga.id}`
            };
        }
        return {
            text: 'Chưa có chapter',
            link: `/mangas/${manga.id}`
        };
    };

    const chapterInfo = getChapterInfo();
    const timeAgo = formatTime(manga.lastChapterAddedAt);

    return (
        <div
            className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
            style={{ isolation: 'isolate' }}
        >
            <figure className="clearfix">
                <div className="relative mb-2">
                    <a title={manga.title} href={`/mangas/${manga.id}`} className="block">
                        <div className="relative pb-[150%]">
                            <div className="absolute inset-0 w-full h-full overflow-hidden">
                                <div className="relative h-full w-full">
                                    {/* Gradient overlay */}
                                    <div className="absolute bottom-0 left-0 z-[1] h-3/5 w-full bg-gradient-to-t from-gray-900/80 from-[15%] to-transparent transition-all duration-500 group-hover:h-3/4"></div>

                                    {/* Manga cover image */}
                                    <img
                                        src={getMangaImageUrl(manga.coverUrl)}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[102%]"
                                        alt={manga.title}
                                        loading="lazy"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/images/default-manga-cover.jpg';
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Overlay content */}
                        <div className="absolute bottom-0 left-0 z-[2] w-full px-3 py-2">
                            <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-tight text-white transition group-hover:line-clamp-4">
                                {manga.title}
                            </h3>
                            <p className="mb-1 text-xs text-gray-300 line-clamp-1">
                                {manga.author || 'Không rõ'}
                            </p>

                            {/* Stats with FontAwesome icons */}
                            <span className="flex items-center justify-between gap-1 text-xs text-gray-300">
                                <span className="flex items-center gap-1">
                                    <FontAwesomeIcon icon={faEye} className="text-yellow-500" />
                                    {formatCount(manga.views || 0)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <FontAwesomeIcon icon={faComment} className="text-blue-400" />
                                    {formatCount(manga.comments || 0)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <FontAwesomeIcon icon={faHeart} className="text-red-500" />
                                    {formatCount(manga.loves || 0)}
                                </span>
                            </span>
                        </div>
                    </a>
                </div>

                {/* Chapter info */}
                <figcaption className="px-3 pb-3 relative z-10 bg-white">
                    <ul className="flex flex-col gap-1">
                        <li className="flex items-center justify-between gap-x-2 text-xs">
                            <a
                                title={chapterInfo.text}
                                className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition visited:text-gray-500 hover:text-purple-600 text-gray-700"
                                href={chapterInfo.link}
                            >
                                {chapterInfo.text}
                            </a>
                            <span className="whitespace-nowrap leading-tight text-gray-500">
                                {timeAgo.replace('trước', '').replace(' ago', '')}
                            </span>
                        </li>
                    </ul>
                </figcaption>
            </figure>
        </div>
    );
};

export default MangaCard;
