import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faComment, faHeart, faTrash } from '@fortawesome/free-solid-svg-icons';
import { getMangaImageUrl } from '../utils/file-utils';
import { FavoriteMangaResponse } from '../interfaces/models/favorite';

interface FavoriteMangaCardProps {
    favorite: FavoriteMangaResponse;
    formatCount: (count: number) => string;
    onRemove: (mangaId: string) => void;
}

const FavoriteMangaCard: React.FC<FavoriteMangaCardProps> = ({ 
    favorite, 
    formatCount,
    onRemove
}) => {
    return (
        <div>
            <div className="group">
                <figure className="clearfix">
                    <div className="relative mb-2">
                        <a title={favorite.mangaTitle} href={`/mangas/${favorite.mangaId}`} className="block">
                            <div className="relative pb-[150%]">
                                <div className="absolute inset-0 w-full h-full overflow-hidden">
                                    <div className="relative h-full w-full">
                                        {/* Gradient overlay */}
                                        <div className="absolute bottom-0 left-0 z-[1] h-3/5 w-full bg-gradient-to-t from-gray-900/80 from-[15%] to-transparent transition-all duration-500 group-hover:h-3/4"></div>
                                        
                                        {/* Manga cover image */}
                                        <img
                                            src={getMangaImageUrl(favorite.mangaCoverUrl)}
                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[102%]"
                                            alt={favorite.mangaTitle}
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
                                    {favorite.mangaTitle}
                                </h3>
                                <p className="mb-1 text-xs text-gray-300 line-clamp-1">
                                    {favorite.author || 'Không rõ'}
                                </p>
                                
                                {/* Stats with FontAwesome icons */}
                                <span className="flex items-center justify-between gap-1 text-xs text-gray-300">
                                    <span className="flex items-center gap-1">
                                        <FontAwesomeIcon icon={faEye} className="text-yellow-500" />
                                        {formatCount(favorite.views || 0)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <FontAwesomeIcon icon={faComment} className="text-blue-400" />
                                        {formatCount(favorite.comments || 0)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <FontAwesomeIcon icon={faHeart} className="text-red-500" />
                                        {formatCount(favorite.loves || 0)}
                                    </span>
                                </span>
                            </div>
                        </a>
                    </div>
                </figure>
            </div>
            
            {/* Remove button */}
            <button
                onClick={() => onRemove(favorite.mangaId)}
                className="justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex h-auto items-center gap-2 bg-purple-600 px-3 py-2 text-[12px] text-white hover:bg-purple-700 mt-2 w-full"
            >
                <span className="shrink-0">
                    <FontAwesomeIcon icon={faTrash} />
                </span>
                Bỏ theo dõi
            </button>
        </div>
    );
};

export default FavoriteMangaCard;
