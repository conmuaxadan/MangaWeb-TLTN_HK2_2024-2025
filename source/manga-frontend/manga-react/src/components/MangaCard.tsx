import React from 'react';

interface Manga {
    id: string;
    title: string;
    image: string;
    chapter: string;
    timeAgo: string;
    link: string;
    chapterLink: string;
}

interface MangaCardProps {
    manga: Manga;
}

const MangaCard: React.FC<MangaCardProps> = ({ manga }) => {
    return (
        <div className="w-full flex flex-col justify-between items-stretch rounded-lg snap-start">
            <a
                href={manga.link}
                className="block rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden relative pb-[150%]"
            >
                <img
                    src={"http://localhost:8888/api/v1/upload/files/"+manga.image}
                    alt={manga.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </a>
            <div className="flex flex-col items-start justify-start md:justify-between">
                <a href={manga.link} className="overflow-hidden">
                    <h3 className="text-gray-300 font-bold text-sm mb-1 line-clamp-1">
                        {manga.title}
                    </h3>
                </a>
                <h4 className="text-xs uppercase tracking-wide text-gray-400 line-clamp-1">
                    <a href={manga.chapterLink}>
                        <span className="font-semibold">{manga.chapter}</span> -{' '}
                        <span>{manga.timeAgo}</span>
                    </a>
                </h4>
            </div>
        </div>
    );
};

export default MangaCard;