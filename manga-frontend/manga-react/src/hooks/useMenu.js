/**
 * Custom hook for menu functionality
 * Handles menu state and outside click detection
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export const useMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showGenresMobile, setShowGenresMobile] = useState(false);
  const menuRef = useRef(null);

  // Toggle menu
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  // Close menu
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    setShowGenresMobile(false);
  }, []);

  // Toggle genres mobile
  const toggleGenresMobile = useCallback(() => {
    setShowGenresMobile(prev => !prev);
  }, []);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  return {
    // State
    isMenuOpen,
    showGenresMobile,
    menuRef,

    // Actions
    toggleMenu,
    closeMenu,
    toggleGenresMobile,
    setIsMenuOpen,
    setShowGenresMobile
  };
};
