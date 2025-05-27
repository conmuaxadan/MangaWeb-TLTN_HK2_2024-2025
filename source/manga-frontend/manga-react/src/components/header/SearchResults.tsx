/**
 * Search Results Dropdown Component
 * Memoized component for better performance
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { MangaResponse } from '../../interfaces/models/manga';
import { getMangaImageUrl } from '../../utils/file-utils';

interface SearchResultsProps {
  isSearching: boolean;
  searchResults: MangaResponse[];
  searchKeyword: string;
  onResultClick: () => void;
  className?: string;
}

const SearchResults = React.memo<SearchResultsProps>(({
  isSearching,
  searchResults,
  searchKeyword,
  onResultClick,
  className = ''
}) => {
  if (isSearching) {
    return (
      <div className={`bg-white rounded-lg shadow-lg overflow-hidden z-50 ${className}`}>
        <div className="p-4 text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500 mr-2"></div>
          Đang tìm kiếm...
        </div>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg overflow-hidden z-50 ${className}`}>
        <div className="p-4 text-center text-gray-500">
          Không tìm thấy kết quả
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden z-50 ${className}`}>
      <div>
        {searchResults.map((manga) => (
          <SearchResultItem
            key={manga.id}
            manga={manga}
            onResultClick={onResultClick}
          />
        ))}
        <div className="p-2 text-center border-t border-gray-200">
          <Link
            to={`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`}
            className="text-xs text-purple-400 hover:text-purple-300"
            onClick={onResultClick}
          >
            Xem tất cả kết quả
          </Link>
        </div>
      </div>
    </div>
  );
});

// Memoized Search Result Item
const SearchResultItem = React.memo<{
  manga: MangaResponse;
  onResultClick: () => void;
}>(({ manga, onResultClick }) => (
  <Link
    to={`/mangas/${manga.id}`}
    className="flex items-center p-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
    onClick={onResultClick}
  >
    <div className="flex-shrink-0 h-12 w-9 bg-gray-200 rounded overflow-hidden mr-3">
      <img
        src={getMangaImageUrl(manga.coverUrl) || '/images/default-manga-cover.jpg'}
        alt={manga.title}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">{manga.title}</p>
      <p className="text-xs text-gray-500 truncate">{manga.author}</p>
    </div>
  </Link>
));

SearchResults.displayName = 'SearchResults';
SearchResultItem.displayName = 'SearchResultItem';

export default SearchResults;
