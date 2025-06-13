/**
 * Custom hook for genres functionality
 * Handles fetching and caching genres data
 */

import { useState, useEffect, useMemo } from 'react';
import mangaService from '../services/manga-service.js';

export const useGenres = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoading(true);
        setError(null);
        const genresData = await mangaService.getAllGenres();
        if (genresData) {
          setGenres(genresData);
        }
      } catch (err) {
        console.error('Lỗi khi lấy danh sách thể loại:', err);
        setError('Không thể tải danh sách thể loại');
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  // Memoized computed values
  const hasGenres = useMemo(() => genres.length > 0, [genres.length]);

  return {
    genres,
    loading,
    error,
    hasGenres
  };
};
