import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';

const GenreSelector = ({
  availableGenres,
  selectedGenres,
  onGenreChange,
  isLoading = false,
  error,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter genres based on search term
  const filteredGenres = useMemo(() => {
    if (!searchTerm.trim()) {
      return availableGenres;
    }
    return availableGenres.filter(genre =>
      genre.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableGenres, searchTerm]);

  // Handle genre toggle
  const handleGenreToggle = (genreName) => {
    if (disabled || isLoading) return;

    const newSelectedGenres = selectedGenres.includes(genreName)
      ? selectedGenres.filter(g => g !== genreName)
      : [...selectedGenres, genreName];

    onGenreChange(newSelectedGenres);
  };

  // Handle remove genre from selected tags
  const handleRemoveGenre = (genreName) => {
    if (disabled || isLoading) return;

    const newSelectedGenres = selectedGenres.filter(g => g !== genreName);
    onGenreChange(newSelectedGenres);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 py-4">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-indigo-500" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Đang tải thể loại...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FontAwesomeIcon icon={faSearch} className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm thể loại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={clearSearch}
            disabled={disabled}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FontAwesomeIcon icon={faTimes} className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Selected genres as tags */}
      {selectedGenres.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Thể loại đã chọn ({selectedGenres.length}):
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedGenres.map((genreName) => (
              <span
                key={genreName}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
              >
                {genreName}
                <button
                  type="button"
                  onClick={() => handleRemoveGenre(genreName)}
                  disabled={disabled}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-600 hover:bg-indigo-200 hover:text-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-800 dark:hover:text-indigo-100 focus:outline-none"
                >
                  <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Genre grid */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Chọn thể loại:
        </label>
        
        {filteredGenres.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
            {searchTerm ? 'Không tìm thấy thể loại nào' : 'Không có thể loại nào'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-3">
            {filteredGenres.map((genre) => {
              const isSelected = selectedGenres.includes(genre.name);
              return (
                <label
                  key={genre.name}
                  className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900 dark:border-indigo-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleGenreToggle(genre.name)}
                    disabled={disabled}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className={`text-sm ${
                    isSelected 
                      ? 'text-indigo-900 font-medium dark:text-indigo-100' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {genre.name}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Chọn một hoặc nhiều thể loại cho truyện. Bạn có thể sử dụng ô tìm kiếm để lọc thể loại.
      </p>
    </div>
  );
};

export default GenreSelector;
