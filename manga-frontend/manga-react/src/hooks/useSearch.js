/**
 * Custom hook for search functionality
 * Handles search state, debouncing, and API calls
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import mangaService from '../services/manga-service.js';
import { searchDebounce } from '../utils/performance.js';

export const useSearch = (options = {}) => {
  const { maxResults = 5, minSearchLength = 2 } = options;
  const navigate = useNavigate();

  // Search state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Memoized computed values
  const hasValidSearch = useMemo(() =>
    searchKeyword.trim().length >= minSearchLength,
    [searchKeyword, minSearchLength]
  );

  const shouldShowResults = useMemo(() =>
    showResults && hasValidSearch,
    [showResults, hasValidSearch]
  );

  // Search function
  const searchManga = useCallback(async (keyword) => {
    if (keyword.trim().length < minSearchLength) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);

    try {
      const results = await mangaService.searchManga(keyword, 0, maxResults);

      if (results && results.content.length > 0) {
        setSearchResults(results.content);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error searching manga:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, [maxResults, minSearchLength]);

  // Debounced search
  const debouncedSearch = useCallback(
    searchDebounce(searchManga),
    [searchManga]
  );

  // Handle search input change
  const handleSearchInputChange = useCallback((value) => {
    setSearchKeyword(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Handle search submit
  const handleSearchSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`);
      return true;
    }
    return false;
  }, [searchKeyword, navigate]);

  // Handle search focus
  const handleSearchFocus = useCallback(() => {
    if (hasValidSearch) {
      setShowResults(true);
    }
  }, [hasValidSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchKeyword('');
    setSearchResults([]);
    setShowResults(false);
  }, []);

  // Hide results
  const hideResults = useCallback(() => {
    setShowResults(false);
  }, []);

  return {
    // State
    searchKeyword,
    searchResults,
    isSearching,
    showResults: shouldShowResults,
    hasValidSearch,

    // Actions
    setSearchKeyword,
    handleSearchInputChange,
    handleSearchSubmit,
    handleSearchFocus,
    clearSearch,
    hideResults,
    setShowResults,

    // Utils
    scrollToTop: () => window.scrollTo(0, 0)
  };
};
