import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { MangaResponse, MangaStatus, MangaStatusDisplayNames } from '../../interfaces/models/manga';
import genreService from '../../services/genre-service';
import { GenreResponse } from '../../interfaces/models/genre';
import { getMangaImageUrl } from '../../utils/file-utils';
import GenreSelector from '../common/GenreSelector';

interface MangaFormProps {
  initialData?: MangaResponse;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const MangaForm: React.FC<MangaFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [yearOfRelease, setYearOfRelease] = useState<number>(new Date().getFullYear());
  const [status, setStatus] = useState<MangaStatus>(MangaStatus.ONGOING);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Available genres
  const [availableGenres, setAvailableGenres] = useState<GenreResponse[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);

  // Load genres
  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true);
      try {
        const genres = await genreService.getAllGenres();
        if (genres) {
          setAvailableGenres(genres);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách thể loại:', error);
      } finally {
        setLoadingGenres(false);
      }
    };

    fetchGenres();
  }, []);

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setAuthor(initialData.author || '');
      setDescription(initialData.description || '');
      setSelectedGenres(initialData.genres || []);
      setYearOfRelease(initialData.yearOfRelease || new Date().getFullYear());
      setStatus(initialData.status || MangaStatus.ONGOING);

      if (initialData.coverUrl) {
        setCoverPreview(getMangaImageUrl(initialData.coverUrl));
      }
    }
  }, [initialData]);

  // Handle cover file change
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setCoverFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Clear error if exists
      if (errors.cover) {
        setErrors(prev => ({ ...prev, cover: '' }));
      }
    }
  };

  // Handle genre selection
  const handleGenreChange = (genres: string[]) => {
    setSelectedGenres(genres);

    // Clear error if exists
    if (errors.genres) {
      setErrors(prev => ({ ...prev, genres: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống';
    }

    if (!author.trim()) {
      newErrors.author = 'Tác giả không được để trống';
    }

    if (!description.trim()) {
      newErrors.description = 'Mô tả không được để trống';
    }

    if (selectedGenres.length === 0) {
      newErrors.genres = 'Phải chọn ít nhất một thể loại';
    }

    if (!initialData && !coverFile) {
      newErrors.cover = 'Phải chọn ảnh bìa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Create FormData object
    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('description', description);
    formData.append('genres', selectedGenres.join(','));
    formData.append('yearOfRelease', yearOfRelease.toString());
    formData.append('status', status);

    if (coverFile) {
      formData.append('cover', coverFile);
    }

    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">
        {initialData ? 'Chỉnh sửa truyện' : 'Thêm truyện mới'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            className={`w-full px-3 py-2 border ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Author */}
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
            Tác giả <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            disabled={isLoading}
            className={`w-full px-3 py-2 border ${
              errors.author ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          />
          {errors.author && (
            <p className="mt-1 text-sm text-red-600">{errors.author}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mô tả <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            rows={5}
            className={`w-full px-3 py-2 border ${
              errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
          )}
        </div>

        {/* Genres */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Thể loại <span className="text-red-500">*</span>
          </label>
          <GenreSelector
            availableGenres={availableGenres}
            selectedGenres={selectedGenres}
            onGenreChange={handleGenreChange}
            isLoading={loadingGenres}
            error={errors.genres}
            disabled={isLoading}
          />
        </div>

        {/* Cover Image */}
        <div>
          <label htmlFor="cover" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ảnh bìa {!initialData && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label
                htmlFor="cover"
                className={`flex justify-center items-center px-4 py-2 border ${
                  errors.cover ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer`}
              >
                <FontAwesomeIcon icon={faUpload} className="mr-2" />
                {coverFile ? 'Thay đổi ảnh' : 'Chọn ảnh'}
                <input
                  type="file"
                  id="cover"
                  accept="image/*"
                  onChange={handleCoverChange}
                  disabled={isLoading}
                  className="sr-only"
                />
              </label>
              {errors.cover && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cover}</p>
              )}
            </div>
            {coverPreview && (
              <div className="w-36 h-48 overflow-hidden rounded-md border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Year of Release */}
        <div>
          <label htmlFor="yearOfRelease" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Năm phát hành
          </label>
          <input
            type="number"
            id="yearOfRelease"
            value={yearOfRelease}
            onChange={(e) => setYearOfRelease(parseInt(e.target.value))}
            disabled={isLoading}
            min={1900}
            max={new Date().getFullYear()}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Trạng thái
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as MangaStatus)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            {Object.entries(MangaStatusDisplayNames).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                Đang xử lý...
              </span>
            ) : initialData ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MangaForm;
