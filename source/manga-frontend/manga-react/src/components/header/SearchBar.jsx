/**
 * Search Bar Component
 * Handles both desktop and mobile search functionality
 */

import React, { useRef, useEffect } from 'react';
import SearchResults from './SearchResults.jsx';
import { useSearch } from '../../hooks/index.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const SearchBar = React.memo(({
  isMobile = false,
  onResultClick,
  className = '',
  placeholder = 'Tìm kiếm truyện...'
}) => {
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

  const {
    searchKeyword,
    searchResults,
    isSearching,
    showResults,
    handleSearchInputChange,
    handleSearchSubmit,
    handleSearchFocus,
    hideResults,
    scrollToTop
  } = useSearch();

  // Handle outside click to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        hideResults();
      }
    };

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showResults, hideResults]);

  const handleResultClick = () => {
    hideResults();
    scrollToTop();
    onResultClick?.();
  };

  const handleSubmit = (e) => {
    const success = handleSearchSubmit(e);
    if (success) {
      hideResults();
      onResultClick?.();
    }
  };



  return (
    <div className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={searchKeyword}
          onChange={(e) => handleSearchInputChange(e.target.value)}
          onFocus={handleSearchFocus}
          placeholder={placeholder}
          className={`w-full bg-gray-100 text-gray-900 rounded-full py-3 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-base ${
            isMobile ? 'text-gray-800 py-2 pl-4 pr-10 text-sm' : ''
          }`}
        />
        <button
          type="submit"
          className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-900 p-1 ${
            isMobile ? 'right-3' : ''
          }`}
        >
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </form>

      {/* Search Results */}
      {showResults && (
        <div
          ref={searchResultsRef}
          className={`absolute top-full left-0 right-0 mt-1 z-[60] ${
            isMobile ? 'max-h-80 overflow-y-auto' : ''
          }`}
          style={isMobile ? {
            position: 'absolute',
            zIndex: 9999,
            backgroundColor: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          } : {}}
        >
          <SearchResults
            isSearching={isSearching}
            searchResults={searchResults}
            searchKeyword={searchKeyword}
            onResultClick={handleResultClick}
          />
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
