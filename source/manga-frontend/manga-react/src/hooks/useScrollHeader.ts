/**
 * Custom hook for header scroll behavior
 * Handles scroll-based header styling with throttling
 */

import { useState, useEffect } from 'react';
import { scrollThrottle } from '../utils/performance';

interface UseScrollHeaderOptions {
  threshold?: number;
}

export const useScrollHeader = (options: UseScrollHeaderOptions = {}) => {
  const { threshold = 10 } = options;
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = scrollThrottle(() => {
      setIsScrolled(window.scrollY > threshold);
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return { isScrolled };
};
