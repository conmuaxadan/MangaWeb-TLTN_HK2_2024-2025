import React from 'react';
import { getMangaImageUrl } from '../utils/file-utils';
import { MangaData } from '../hooks/useTopManga';

interface MangaListItemProps {
    manga: MangaData;
    index: number;
    statIcon?: React.ReactNode | null;
    statValue: string;
}

const MangaListItem: React.FC<MangaListItemProps> = ({
    manga,
    index,
    statIcon,
    statValue
}) => {
    // Hàm xác định màu sắc cho ranking
    const getRankingColor = (index: number) => {
        switch (index) {
            case 0:
                return 'text-yellow-500'; // Vàng cho hạng 1
            case 1:
                return 'text-gray-300'; // Bạc cho hạng 2
            case 2:
                return 'text-amber-700'; // Đồng cho hạng 3
            default:
                return 'text-gray-500'; // Xám cho các hạng khác
        }
    };

    return (
        <li className="relative flex items-center gap-4 py-3 px-2 hover:bg-gray-100 transition-colors rounded-lg">
            {/* Số thứ hạng */}
            <div className="flex items-center justify-center w-8 h-8">
                <span className={`text-2xl font-black ${getRankingColor(index)}`}>
                    {index + 1}
                </span>
            </div>

            {/* Ảnh bìa manga - Tỷ lệ 2:3 (manga standard) */}
            <a
                className="relative w-14 h-20 shrink-0 rounded overflow-hidden shadow-lg"
                title={manga.title}
                href={`/mangas/${manga.id}`}
            >
                <img
                    className="h-full w-full object-cover"
                    src={getMangaImageUrl(manga.coverUrl)}
                    alt={manga.title}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/default-manga-cover.jpg';
                    }}
                />
            </a>

            {/* Thông tin manga */}
            <div className="flex-1 min-w-0">
                <h3 className="truncate">
                    <a
                        className="text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors"
                        href={`/mangas/${manga.id}`}
                    >
                        {manga.title}
                    </a>
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                    {statIcon && statIcon}
                    {statValue}
                </div>
            </div>
        </li>
    );
};

export default MangaListItem;
